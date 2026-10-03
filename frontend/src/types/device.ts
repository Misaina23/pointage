export type DeviceStatusValue = "active" | "inactive";

export type Device = {
    id: number;
    name: string;
    device_code: string;
    location: string | null;
    status: DeviceStatusValue;
    last_seen_at: string | null;
};

export type DeviceList = {
    data: Device[];
};

export type StoreDevicePayload = {
    name: string;
    device_code: string;
    location?: string | null;
};

export type DeviceFilters = {
    status?: DeviceStatusValue;
};