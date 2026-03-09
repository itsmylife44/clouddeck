import type {
  DatalixResponse,
  ServiceListItem,
  ServiceDetailRaw,
  ServiceStatus,
  ServiceOs,
  ServiceIp,
  LiveData,
  TrafficData,
  Backup,
  CronJob,
  KvmLine,
  KvmPacket,
  PowerAction,
} from "./types";

const BASE_URL = "https://backend.datalix.de/v1";

export class DatalixClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private static sanitizePath(segment: string): string {
    if (/[\/\\?#&=]/.test(segment)) {
      throw new Error(`Invalid path segment: ${segment}`);
    }
    return encodeURIComponent(segment);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<DatalixResponse<T>> {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("token", this.token);

    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(url.toString(), { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data?.message || `HTTP ${response.status}`,
        requestId: response.headers.get("X-Request-Id") ?? undefined,
      };
    }

    return {
      status: "success",
      data: data as T,
      requestId: response.headers.get("X-Request-Id") ?? undefined,
    };
  }

  // ─── Services ──────────────────────────────────────────

  async listServices(): Promise<DatalixResponse<ServiceListItem[]>> {
    return this.request("GET", "/service/list");
  }

  async getService(serviceId: string): Promise<DatalixResponse<ServiceDetailRaw>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}`);
  }

  async getServiceStatus(serviceId: string): Promise<DatalixResponse<ServiceStatus>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/status`);
  }

  async getServiceOs(serviceId: string): Promise<DatalixResponse<ServiceOs[]>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/os`);
  }

  async getServiceIps(serviceId: string): Promise<DatalixResponse<ServiceIp[]>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/ip`);
  }

  async setRdns(
    serviceId: string,
    ip: string,
    rdns: string
  ): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    const sip = DatalixClient.sanitizePath(ip);
    return this.request("POST", `/service/${sid}/ip/${sip}/rdns`, { rdns });
  }

  // ─── Power Actions ────────────────────────────────────

  async powerAction(
    serviceId: string,
    action: PowerAction
  ): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/${action}`);
  }

  async reinstall(
    serviceId: string,
    os: number
  ): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/reinstall`, { os });
  }

  // ─── Backups ──────────────────────────────────────────

  async listBackups(serviceId: string): Promise<DatalixResponse<Backup[]>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/backup`);
  }

  async createBackup(serviceId: string): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/backup`);
  }

  async restoreBackup(
    serviceId: string,
    backup: string
  ): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/backup/restore`, { backup });
  }

  async deleteBackup(
    serviceId: string,
    backup: string
  ): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/backup/delete`, { backup });
  }

  // ─── Cron Jobs ────────────────────────────────────────

  async listCronJobs(serviceId: string): Promise<DatalixResponse<CronJob[]>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/cron`);
  }

  async createCronJob(
    serviceId: string,
    data: { name: string; action: string; expression: string }
  ): Promise<DatalixResponse<CronJob>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/cron`, data);
  }

  async updateCronJob(
    serviceId: string,
    cronId: string,
    data: { name: string; action: string; expression: string }
  ): Promise<DatalixResponse<CronJob>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    const cid = DatalixClient.sanitizePath(cronId);
    return this.request("POST", `/service/${sid}/cron/${cid}`, data);
  }

  async deleteCronJob(
    serviceId: string,
    cronId: string
  ): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    const cid = DatalixClient.sanitizePath(cronId);
    return this.request("DELETE", `/service/${sid}/cron/${cid}/delete`);
  }

  // ─── Extend ───────────────────────────────────────────

  async extendService(
    serviceId: string,
    days: number,
    credit?: boolean
  ): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/extend`, {
      days,
      ...(credit !== undefined && { credit }),
    });
  }

  async hideService(serviceId: string): Promise<DatalixResponse<void>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("POST", `/service/${sid}/hide`);
  }

  async getNoVnc(serviceId: string): Promise<DatalixResponse<{ url: string }>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/novnc`);
  }

  // ─── KVM Info (no auth) ───────────────────────────────

  async getKvmLine(lineId: string): Promise<DatalixResponse<KvmLine>> {
    return this.request("GET", `/kvmserver/line/${lineId}`);
  }

  async getKvmPacket(packetId: string): Promise<DatalixResponse<KvmPacket>> {
    return this.request("GET", `/kvmserver/packet/${packetId}`);
  }

  async getKvmPacketOs(packetId: string): Promise<DatalixResponse<ServiceOs[]>> {
    return this.request("GET", `/kvmserver/packet/${packetId}/os`);
  }

  // ─── Live Data / Monitoring ──────────────────────────────

  async getLiveData(serviceId: string): Promise<DatalixResponse<LiveData>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/livedata`);
  }

  async getTraffic(serviceId: string): Promise<DatalixResponse<TrafficData>> {
    const sid = DatalixClient.sanitizePath(serviceId);
    return this.request("GET", `/service/${sid}/traffic`);
  }

  // ─── Test Connection ──────────────────────────────────

  async testConnection(): Promise<boolean> {
    const result = await this.listServices();
    return result.status === "success";
  }
}
