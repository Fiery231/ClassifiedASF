class rotationUtils {
    constructor() {
        this.activeRotation = null;
        this.rotationInProgress = false;
    }

    calcYawPitch(x, y, z) {
        const px = Player.getX();
        const py = Player.getY() + Player.getPlayer().getEyeHeight(Player.getPlayer().getPose());
        const pz = Player.getZ();

        const dx = x - px;
        const dy = y - py;
        const dz = z - pz;

        const dist = Math.sqrt(dx * dx + dz * dz);

        const yaw = Math.atan2(dz, dx) * 180 / Math.PI - 90;
        const pitch = -(Math.atan2(dy, dist) * 180 / Math.PI);

        return [yaw, pitch];
    }

    rotate(yaw, pitch) {
        if (Number.isNaN(yaw) || Number.isNaN(pitch)) return;
        Player.getPlayer().setYaw(yaw);
        Player.getPlayer().setPitch(pitch);
    }

    normalizeYaw(yaw) {
        while (yaw > 180) yaw -= 360;
        while (yaw < -180) yaw += 360;
        return yaw;
    }

    getShortestYaw(from, to) {
        let diff = this.normalizeYaw(to - from);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return diff;
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    rotateSmoothly(targetYaw, targetPitch, duration = 150, onComplete) {
        if (this.activeRotation) this.activeRotation.unregister();

        const startYaw = Player.getYaw();
        const startPitch = Player.getPitch();

        const yawDiff = this.getShortestYaw(startYaw, targetYaw);
        const pitchDiff = targetPitch - startPitch;

        const startTime = Date.now();
        this.rotationInProgress = true;

        this.activeRotation = register("step", () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutCubic(progress);

            const yaw = startYaw + yawDiff * eased;
            const pitch = startPitch + pitchDiff * eased;

            this.rotate(yaw, pitch);

            if (progress >= 1) {
                this.stopRotation();
                if (onComplete) onComplete();
            }
        }).setFps(120);
    }

    stopRotation() {
        if (this.activeRotation) {
            this.activeRotation.unregister();
            this.activeRotation = null;
        }
        this.rotationInProgress = false;
    }

    isRotating() {
        return this.rotationInProgress;
    }
}

export default new rotationUtils();