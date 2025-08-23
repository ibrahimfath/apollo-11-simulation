import * as THREE from "three";
import { G } from "./constants";
import { Earth } from "../objects/Earth";
import { Moon } from "../objects/Moon";
import { Spacecraft } from "../objects/Spacecraft";

export type TransferPhase = "waiting" | "first_burn_complete" | "transferring" | "second_burn_complete" | "complete";

export class HohmannTransfer {
    private earth: Earth;
    private moon: Moon;
    private spacecraft: Spacecraft;
    private r0: number = 0; // initial distance between moon and spacecraft orbit (m)
    private r1: number = 0; // initial distance between earth and spacecraft (m)
    private r2: number = 0; // initial distance between earth and moon (m)
    private semiMajorAxis: number = 0; // semi-major axis of the transfer orbit (m)
    private earthMU: number = 0; // earth gravitational parameter (μ) (m^3/s^2)
    private moonMU: number = 0; // moon gravitational parameter (μ) (m^3/s^2)
    private v1: number = 0; // velocity of the spacecraft at the earth orbit (m/s)
    private v2: number = 0; // velocity of the spacecraft at the lunar orbit (m/s)
    public deltaV1: number = 0; // first burn Δv (m/s)
    public deltaV2: number = 0; // second burn Δv (m/s)
    public totalDeltaV: number = 0; // total Δv (m/s)
    public transferTime: number = 0; // transfer time (s)
    private theta: number = 0; // the required angle between spacecraft and moon to start the transfer (degrees)
    private lastRadialVelocity: number | null = null;

    public distanceToMoon: number = 0; // distance to moon for gui (m)
    
    // Transfer state
    public phase: TransferPhase = "waiting";

    constructor(earth: Earth, moon: Moon, spacecraft: Spacecraft) {
        this.earth = earth;
        this.moon = moon;
        this.spacecraft = spacecraft;
        this.earthMU = this.earth.mass * G;
        this.moonMU = this.moon.mass * G;
        this.r0 = this.moon.radius + 100_000;
    }
    
    private updateValues() {
        this.r1 = this.earth.r_m.distanceTo(this.spacecraft.r_m);
        this.r2 = this.earth.r_m.distanceTo(this.moon.r_m) + 100_000;
        this.v1 = this.spacecraft.v_mps.length();
        this.v2 = Math.sqrt(this.moonMU / this.r0); // !mark
        this.semiMajorAxis = (this.r1 + this.r2) / 2;
        this.deltaV1 = Math.sqrt(this.earthMU * (2 / this.r1 - 1 / this.semiMajorAxis)) - this.v1;
        this.deltaV2 = Math.sqrt(this.earthMU * (2 / this.r2 - 1 / this.semiMajorAxis)) - this.v2;
        this.totalDeltaV = this.deltaV1 + this.deltaV2;
        this.transferTime = Math.PI * Math.sqrt(Math.pow(this.semiMajorAxis, 3) / this.earthMU);
        this.theta = Math.PI - (2 * Math.PI * this.transferTime / this.moon.orbitPeriod);
    }

    /** Format time for display */
    public formatTime(): string {
        const days = Math.floor(this.transferTime / (24 * 3600));
        const hours = Math.floor((this.transferTime % (24 * 3600)) / 3600);
        const minutes = Math.floor((this.transferTime % 3600) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /** Checks if the first burn should be triggered */
    private shouldTriggerFirstBurn(): boolean {
        if (this.phase !== "waiting") {
            return false;
        }
        this.updateValues();
        
        // Returns true if the angle between the spacecraft and the moon (as seen from Earth) is within a small threshold of the required phase angle (theta)
        // Computes the angle between the vectors (Earth->Spacecraft) and (Earth->Moon)
        const r_sc = this.spacecraft.r_m.clone().sub(this.earth.r_m); // vector from Earth to spacecraft
        const r_moon = this.moon.r_m.clone().sub(this.earth.r_m);     // vector from Earth to moon

        // Angle between the two vectors (in radians)
        const angle = r_sc.angleTo(r_moon);

        // Check if the angle is within a small threshold of the required phase angle (theta)
        const threshold = 0.01; // radians (~0.57 deg)
        return Math.abs(angle - this.theta) < threshold;
    }

    /** Checks if the second burn should be triggered */
    private shouldTriggerSecondBurn(): boolean {
        if (this.phase !== "transferring") {
            return false;
        }
        // Relative state w.r.t. Earth
        const rRel = this.spacecraft.r_m.clone().sub(this.earth.r_m);
        const vRel = this.spacecraft.v_mps.clone().sub(this.earth.v_mps);

        const r = rRel.length();
        if (r <= 0) return false;

        // Radial velocity (m/s)
        const vr = rRel.dot(vRel) / r;

        // Tolerances (tune for your sim)
        const radiusTol = Math.max(0.005 * this.r2, 20_000); // 0.5% or 20 km
        const vrTol = 1.0; // m/s

        const nearTargetRadius = Math.abs(r - this.r2) < radiusTol;
        const nearApoapsisNow = Math.abs(vr) < vrTol;

        // Detect sign flip (+ → −) through apoapsis
        const crossedApoapsis = this.lastRadialVelocity !== null && this.lastRadialVelocity > 0 && vr <= 0;

        this.lastRadialVelocity = vr;

        return nearTargetRadius && (nearApoapsisNow || crossedApoapsis);
    }


    /** Applies the first burn to the spacecraft */
    private applyFirstBurn() {
        this.spacecraft.burnPrograde(this.deltaV1);
        this.phase = "first_burn_complete";
    }

    /** Applies the second burn to the spacecraft */
    private applySecondBurn() {
        this.spacecraft.burnRetrograde(this.deltaV2);
        this.phase = "second_burn_complete";
    }

    /** Update method called every frame */
    public update(deltaTime: number = 0) {
        this.distanceToMoon = this.moon.r_m.distanceTo(this.spacecraft.r_m);

        if (this.shouldTriggerFirstBurn()) {
            console.log("First burn triggered");
            this.applyFirstBurn();
            this.phase = "transferring";
        }

        if (this.shouldTriggerSecondBurn()) {
            console.log("Second burn triggered");
            this.applySecondBurn();
            this.phase = "complete";
        }
    }

    /** Manual trigger for first burn */
    public triggerFirstBurn() {
        this.applyFirstBurn();
        this.phase = "transferring";
    }

    /** Manual trigger for second burn */
    public triggerSecondBurn() {
        this.applySecondBurn();
        this.phase = "complete";
    }
}