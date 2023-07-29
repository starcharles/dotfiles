export default class TelemetryReporter {
    private extensionId;
    private extensionVersion;
    private userOptIn;
    private readonly configListener;
    private static TELEMETRY_SECTION_ID;
    private static TELEMETRY_SETTING_ID;
    private static TELEMETRY_OLD_SETTING_ID;
    constructor(extensionId: string, extensionVersion: string);
    sendTelemetryEvent(): Promise<void>;
    private updateUserOptIn;
    dispose(): void;
}
