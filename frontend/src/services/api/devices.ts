import { get, post, remove } from "./client";
import type { Device, DeviceFilters, DeviceList, StoreDevicePayload } from "@/types/device";

export function listDevices(filters: DeviceFilters = {}, signal?: AbortSignal): Promise<DeviceList> {
    return get<DeviceList>("/devices", { ...filters }, signal);
}

export function createDevice(payload: StoreDevicePayload): Promise<{ data: Device }> {
    return post<{ data: Device }>("/devices", payload);
}

export function deleteDevice(id: number): Promise<void> {
    return remove<void>(`/devices/${id}`);
}