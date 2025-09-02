import * as THREE from "three";
import { G } from "./constants";
import { Earth } from "../objects/Earth";
import { Moon } from "../objects/Moon";
import { Spacecraft } from "../objects/Spacecraft";

export type TransferPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export class HohmannTransfer {
    private earth: Earth;
    private moon: Moon;
    private spacecraft: Spacecraft;
    private r1: number = 0; // initial distance between earth and spacecraft (m)
    private r2: number = 0; // initial distance between earth and moon (m)
    private semiMajorAxis: number = 0; // semi-major axis of the transfer orbit (m)
    private earthMU: number = 0; // earth gravitational parameter (μ) (m^3/s^2)
    private moonMU: number = 0; // moon gravitational parameter (μ) (m^3/s^2)
    public deltaV1: number = 0; // first burn Δv (m/s)
    public deltaV2: number = 0; // second burn Δv (m/s)
    public deltaV3: number = 0; // third burn Δv (m/s)
    public deltaV4: number = 0; // fourth burn Δv (m/s)
    public transferTime: number = 0; // transfer time (s)
    private theta: number = 0; // the required angle between spacecraft and moon to start the transfer (radians)
    private lastVrMoon: number | null = null; // last velocity relative to moon (m/s)
    private llo: number = 0; // low lunar orbit (m)
    private captureApoAltKm: number = 600; // desired apolune altitude after LOI-1 (km)

    public distanceToMoon: number = 0; // distance to moon for gui (m)
    public lowestDistanceToMoon: number = Infinity; // lowest distance to moon for gui (m)
    // Gating to keep 2nd and 3rd burns from happening back-to-back
    private timeSinceSecond_s: number = Infinity;
    private minWaitAfterSecond_s: number = 0;
    private rAtSecond_m: number = 0;
    private seenVrPositiveSinceSecond: boolean = false;
    
    // Transfer state
    public phase: TransferPhase = 0;

    constructor(earth: Earth, moon: Moon, spacecraft: Spacecraft, llo: number = 250) { // 250km: stable altitude
        this.earth = earth;
        this.moon = moon;
        this.spacecraft = spacecraft;
        this.earthMU = this.earth.mass * G;
        this.moonMU = this.moon.mass * G;
        this.llo = llo * 1000;
    }

    private computeDeltaV1() {
        if (this.phase === 0 || this.phase > 1) {
            return;
        }
        this.r1 = this.earth.r_m.distanceTo(this.spacecraft.r_m);
        this.r2 = this.earth.r_m.distanceTo(this.moon.r_m) - this.moon.radius - this.llo;
        this.semiMajorAxis = (this.r1 + this.r2) / 2;
        const v1 = this.spacecraft.v_mps.clone().sub(this.earth.v_mps).length();
        this.deltaV1 = Math.sqrt(this.earthMU * (2 / this.r1 - 1 / this.semiMajorAxis)) - v1;
        this.transferTime = Math.PI * Math.sqrt(Math.pow(this.semiMajorAxis, 3) / this.earthMU);
        this.theta = Math.PI - (2 * Math.PI * this.transferTime / this.moon.orbitPeriod);
    }

    private computeDeltaV2() {
        if (this.phase === 0 || this.phase > 3) {
            return;
        }
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps); // relative velocity between spacecraft and Moon
        const r = rMoonRel.length(); // distance between spacecraft and Moon (m)
        const rp = r; // current periapsis
        const raTarget = this.moon.radius + this.captureApoAltKm * 1000; // desired apolune radius
        const aTarget = 0.5 * (rp + raTarget); // semi-major axis of the target ellipse
        const vPeriTarget = Math.sqrt(this.moonMU * (2 / rp - 1 / aTarget));
        const vRelMag = vMoonRel.length(); // relative velocity magnitude between spacecraft and Moon
        this.deltaV2 = Math.max(0, vRelMag - vPeriTarget); // magnitude of the burn
    }

    private computeDeltaV3() {
        if (this.phase === 0 || this.phase > 5) {
            return;
        }
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps); // relative velocity between spacecraft and Moon
        const ra = rMoonRel.length(); // distance between spacecraft and Moon
        const rpTarget = this.moon.radius + this.llo; // desired periapsis radius
        const aTarget = 0.5 * (ra + rpTarget); // semi-major axis of the target ellipse
        const vApoTarget = Math.sqrt(this.moonMU * (2 / ra - 1 / aTarget));
        const vRelMag = vMoonRel.length(); // relative velocity magnitude between spacecraft and Moon
        this.deltaV3 = Math.abs(vRelMag - vApoTarget);
    }

    private computeDeltaV4() {
        if (this.phase === 0 || this.phase > 6) {
            return;
        }
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps);
        const r = rMoonRel.length(); // distance between spacecraft and Moon
        const vCirc = Math.sqrt(this.moonMU / r); // circular velocity at the perilune
        const vRelMag = vMoonRel.length(); // relative velocity magnitude between spacecraft and Moon
        this.deltaV4 = Math.max(0, vRelMag - vCirc);
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

    public startTheMission() {
        if (this.phase !== 0) {
            return;
        }
        this.phase = 1;
    }

    /** Checks if the first burn should be triggered */
    private shouldTriggerFirstBurn(): boolean {
        if (this.phase !== 1) {
            return false;
        }
        
        // Returns true if the angle between the spacecraft and the moon (as seen from Earth) is within a small threshold of the required phase angle (theta)
        // Computes the angle between the vectors (Earth->Spacecraft) and (Earth->Moon)
        const r_sc = this.spacecraft.r_m.clone().sub(this.earth.r_m); // vector from Earth to spacecraft
        const r_moon = this.moon.r_m.clone().sub(this.earth.r_m);     // vector from Earth to moon
        const vRel = this.spacecraft.v_mps.clone().sub(this.earth.v_mps);
        const h = r_sc.clone().cross(vRel).normalize(); // orbit normal for sign
        const angleSigned = Math.atan2(r_sc.clone().cross(r_moon).dot(h) /** sine */, r_sc.dot(r_moon) /** cosine */); // (-π, π]

        // Check if the angle is within a small threshold of the required phase angle (theta)
        const threshold = 0.01; // radians (~0.57 deg)
        return Math.abs(angleSigned - this.theta) < threshold;
    }

    /** Applies the first burn to the spacecraft */
    private applyFirstBurn() {
        this.r1 = this.earth.r_m.distanceTo(this.spacecraft.r_m);
        this.r2 = this.earth.r_m.distanceTo(this.moon.r_m) - this.moon.radius - this.llo;
        this.semiMajorAxis = (this.r1 + this.r2) / 2;
        const v1 = this.spacecraft.v_mps.clone().sub(this.earth.v_mps).length();
        this.deltaV1 = Math.sqrt(this.earthMU * (2 / this.r1 - 1 / this.semiMajorAxis)) - v1;
        this.spacecraft.burnPrograde(this.deltaV1);
        this.phase = 2;
    }

    /** Checks if the second burn (LOI-1 capture) should be triggered */
    private shouldTriggerSecondBurn(): boolean {
        if (this.phase !== 3) {
            return false;
        }
        
        // Moon-centric test (for capture burn)
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps); // relative velocity between spacecraft and Moon

        const r = rMoonRel.length(); // distance between spacecraft and Moon
        if (r <= 0) return false;

        const vrMoon = rMoonRel.dot(vMoonRel) / r; // relative velocity along the vector from Moon to spacecraft (how fast we're moving toward or away from the Moon)

        const crossedPeri = this.lastVrMoon !== null && this.lastVrMoon < 0 && vrMoon >= 0; // -→+ (the spacecraft crossed the periapsis of its orbit)

        // Use Moon's approximate sphere of influence as a gate
        const earthMoonDist = this.earth.r_m.distanceTo(this.moon.r_m); // distance between Earth and Moon (m)
        const soiMoon = earthMoonDist * Math.pow(this.moon.mass / this.earth.mass, 2/5);
        const insideGate = r < soiMoon * 1.2; // slightly outside SOI to be lenient (1.2 is a leniency factor)

        this.lastVrMoon = vrMoon;

        // Trigger strictly at periselene using sign flip to avoid multi-burn in same step
        const atPeriselene = insideGate && crossedPeri;

        return atPeriselene;
    }

    /** Applies the second burn (LOI-1 capture to ellipse) to the spacecraft */
    private applySecondBurn() {
        // Compute burn magnitude from current Moon-relative state (robust if called manually)
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps); // relative velocity between spacecraft and Moon
        const r = rMoonRel.length(); // distance between spacecraft and Moon (m)
        const rp = r; // current periapsis
        const raTarget = this.moon.radius + this.captureApoAltKm * 1000; // desired apolune radius
        const aTarget = 0.5 * (rp + raTarget); // semi-major axis of the target ellipse
        const vPeriTarget = Math.sqrt(this.moonMU * (2 / rp - 1 / aTarget));
        const vRelMag = vMoonRel.length(); // relative velocity magnitude between spacecraft and Moon
        const dv = Math.max(0, vRelMag - vPeriTarget); // magnitude of the burn
        this.deltaV2 = dv; // magnitude of the burn
        // Apply retrograde relative to Moon, not inertial
        if (dv > 0 && vRelMag > 0) { // if the burn is positive and the relative velocity is positive
            const retroRelDir = vMoonRel.clone().normalize().negate(); // retrograde relative to Moon, not inertial
            this.spacecraft.applyDeltaV(retroRelDir.multiplyScalar(dv));
        }
        this.phase = 4;
        // Initialize gating for 3rd burn
        this.timeSinceSecond_s = 0;
        this.rAtSecond_m = r;
        this.seenVrPositiveSinceSecond = false;
        // Estimate period of the post-capture ellipse and set a min wait to avoid immediate apolune trigger
        const aEll = 0.5 * (rp + raTarget);
        const T = 2 * Math.PI * Math.sqrt(Math.pow(aEll, 3) / this.moonMU);
        this.minWaitAfterSecond_s = 0.1 * T; // wait ~10% of an orbit before allowing apolune trigger
    }

    /** Checks if the third burn (apolune tweak to set periapsis = R_moon + LLO) should be triggered */
    private shouldTriggerThirdBurn(): boolean {
        if (this.phase !== 4) {
            return false;
        }
        // Detect next apolune after LOI-1
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps); // relative velocity between spacecraft and Moon
        const r = rMoonRel.length(); // distance between spacecraft and Moon
        if (r <= 0) return false;
        const vrMoon = rMoonRel.dot(vMoonRel) / r; // relative velocity along the vector from Moon to spacecraft
        // Always track outbound and lastVr even if gating not yet satisfied
        if (vrMoon > 0) this.seenVrPositiveSinceSecond = true;
        const lastVr = this.lastVrMoon;
        this.lastVrMoon = vrMoon; // update memory each frame

        // SOI gate
        const earthMoonDist = this.earth.r_m.distanceTo(this.moon.r_m); // distance between Earth and Moon (m)
        const soiMoon = earthMoonDist * Math.pow(this.moon.mass / this.earth.mass, 2/5);
        const insideGate = r < soiMoon * 1.2; // slightly outside SOI to be lenient (1.2 is a leniency factor)

        // Apolune detection with small window, plus sign flip when it happens
        const speedRel = vMoonRel.length();
        const vrTol = Math.max(0.5, 0.005 * speedRel); // >=0.5 m/s or ~0.5% of speed
        const crossedApo = lastVr !== null && lastVr > 0 && vrMoon <= 0; // +→-
        const nearApo = Math.abs(vrMoon) < vrTol;

        // Gating: require time elapsed, outbound observed, and radius growth margin
        const enoughTime = this.timeSinceSecond_s >= this.minWaitAfterSecond_s;
        const outboundSeen = this.seenVrPositiveSinceSecond;
        const rMargin = Math.max(5000, 0.1 * this.llo); // at least 5 km or 10% of LLO
        const grownEnough = r >= this.rAtSecond_m + rMargin;

        const atApolune = insideGate && enoughTime && outboundSeen && grownEnough && (crossedApo || nearApo);

        return atApolune;
    }

    /** Applies the third burn at apolune to set periapsis = R_moon + LLO */
    private applyThirdBurn() {
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps); // relative velocity between spacecraft and Moon
        const ra = rMoonRel.length(); // distance between spacecraft and Moon
        const rpTarget = this.moon.radius + this.llo; // desired periapsis radius
        const aTarget = 0.5 * (ra + rpTarget); // semi-major axis of the target ellipse
        const vApoTarget = Math.sqrt(this.moonMU * (2 / ra - 1 / aTarget));
        const vRelMag = vMoonRel.length(); // relative velocity magnitude between spacecraft and Moon
        const dvMag = Math.abs(vRelMag - vApoTarget);
        this.deltaV3 = dvMag; // magnitude of the burn
        if (dvMag > 0 && vRelMag > 0) {
            const dir = vMoonRel.clone().normalize(); // direction of the relative velocity
            // If current speed is higher than target, burn retrograde; else prograde
            const burnDir = (vRelMag > vApoTarget) ? dir.clone().negate() : dir; // retrograde if current speed is higher than target, else prograde
            this.spacecraft.applyDeltaV(burnDir.multiplyScalar(dvMag));
        }
        this.phase = 5;
    }

    /** Checks if the fourth burn (final circularization at perilune to LLO) should be triggered */
    private shouldTriggerFourthBurn(): boolean {
        if (this.phase !== 5) {
            return false;
        }
        // Detect next periselene after apolune tweak
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps); // relative velocity between spacecraft and Moon
        const r = rMoonRel.length(); // distance between spacecraft and Moon
        if (r <= 0) return false;
        const vrMoon = rMoonRel.dot(vMoonRel) / r; // relative velocity along the vector from Moon to spacecraft

        const earthMoonDist = this.earth.r_m.distanceTo(this.moon.r_m); // distance between Earth and Moon (m)
        const soiMoon = earthMoonDist * Math.pow(this.moon.mass / this.earth.mass, 2/5);
        const insideGate = r < soiMoon * 1.2; // slightly outside SOI to be lenient (1.2 is a leniency factor)
        const crossedPeri = this.lastVrMoon !== null && this.lastVrMoon < 0 && vrMoon >= 0; // -→+ (the spacecraft crossed the periapsis of its orbit)
        this.lastVrMoon = vrMoon;

        const atPeriselene = insideGate && crossedPeri; // trigger strictly at periapsis using sign flip
        
        return atPeriselene;
    }

    /** Applies the fourth burn: circularize at current perilune (targeting LLO) */
    private applyFourthBurn() {
        const rMoonRel = this.spacecraft.r_m.clone().sub(this.moon.r_m); // vector from Moon to spacecraft
        const vMoonRel = this.spacecraft.v_mps.clone().sub(this.moon.v_mps);
        const r = rMoonRel.length(); // distance between spacecraft and Moon
        const vCirc = Math.sqrt(this.moonMU / r); // circular velocity at the perilune
        const vRelMag = vMoonRel.length(); // relative velocity magnitude between spacecraft and Moon
        const dv = Math.max(0, vRelMag - vCirc);
        this.deltaV4 = dv;
        if (dv > 0 && vRelMag > 0) {
            const retroRelDir = vMoonRel.clone().normalize().negate(); // retrograde relative to Moon, not inertial
            this.spacecraft.applyDeltaV(retroRelDir.multiplyScalar(dv));
        }
        this.phase = 6;
    }

    /** Update method called every frame */
    public update(deltaTime: number = 0) {
        this.distanceToMoon = this.moon.r_m.distanceTo(this.spacecraft.r_m) - this.moon.radius; // distance to moon for gui (m)
        this.lowestDistanceToMoon = Math.min(this.lowestDistanceToMoon, this.distanceToMoon);
        if (this.phase !== 1 && this.transferTime > 0) {
            this.transferTime = Math.max(0, this.transferTime - deltaTime);
        }
        if (this.timeSinceSecond_s < Infinity) this.timeSinceSecond_s += deltaTime;

        if (this.phase === 0) {
            return;
        }
        this.computeDeltaV1();
        this.computeDeltaV2();
        this.computeDeltaV3();
        this.computeDeltaV4();

        if (this.shouldTriggerFirstBurn()) {
            this.applyFirstBurn();
            this.phase = 3;
        }

        if (this.shouldTriggerSecondBurn()) {
            this.applySecondBurn();
            return; // ensure only one burn per frame
        }

        if (this.shouldTriggerThirdBurn()) {
            this.applyThirdBurn();
            return; // ensure only one burn per frame
        }

        if (this.shouldTriggerFourthBurn()) {
            this.applyFourthBurn();
            this.phase = 7;
            return; // ensure only one burn per frame
        }
    }

    /** Manual trigger for first burn */
    public triggerFirstBurn() {
        this.applyFirstBurn();
        this.phase = 3;
    }

    /** Manual trigger for second burn */
    public triggerSecondBurn() {
        this.applySecondBurn();
    }

    /** Manual trigger for third burn */
    public triggerThirdBurn() {
        this.applyThirdBurn();
    }

    /** Manual trigger for fourth burn */
    public triggerFourthBurn() {
        this.applyFourthBurn();
        this.phase = 7;
    }

    /** Get a descriptive string for the current phase */
    public getPhaseString(): string {
        switch (this.phase) {
            case 0: return "Off";
            case 1: return "Waiting for Phase Angle";
            case 2: return "First Burn Complete";
            case 3: return "Transferring";
            case 4: return "Second Burn Complete";
            case 5: return "Third Burn Complete";
            case 6: return "Fourth Burn Complete";
            case 7: return "Complete";
            default: return "Unknown";
        }
    }
}