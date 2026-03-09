export interface DatalixResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  requestId?: string;
}

// Raw API response for GET /service/{id} — nested structure
export interface ServiceDetailRaw {
  display: Record<string, unknown>;
  product: Record<string, unknown>;
  service: Record<string, unknown>;
}

// List endpoint returns flat objects with limited fields
export interface ServiceListItem {
  id: string;
  created_on: number;
  expire_at: number;
  delete_at?: number;
  deletedone?: number;
  preorder?: number;
  name: string | null;
  price?: string | number;
  productdisplay?: string;
  productid?: number;
  ip?: string;
  daysleft?: number;
  locked?: number;
  fav?: number;
  renew?: number;
  autorenew?: number;
  addons?: boolean;
}

// Flattened service detail (merged from display + product + service)
export interface Service {
  id: string;
  created_on: number;
  expire_at: number;
  delete_at?: number;
  deletedone?: number;
  preorder?: number;
  name: string | null;
  price?: string | number;
  productdisplay?: string;
  cores?: number;
  memory?: number;
  disk?: number;
  uplink?: number;
  hostname?: string;
  mac?: string;
  user?: string;
  password?: string;
  os?: string;
  packet?: string;
  nodeid?: string;
  serviceid?: string;
  proxmoxid?: number;
  status?: string;
  additionaltraffic?: number;
  ip?: string;
  daysleft?: number;
  backup?: boolean | number;
  cron?: boolean | number;
  hardware?: boolean | number;
  livedata?: boolean | number;
  novnc?: boolean | number;
  traffic?: boolean | number;
}

/** Flatten the nested Datalix API response into a single Service object */
export function flattenServiceDetail(raw: ServiceDetailRaw): Service {
  const { ip: _ip, ...serviceRest } = raw.service;
  // Product fields override service, but service keeps id/created_on/expire_at/delete_at
  const { id: _pid, created_on: _pcr, expire_at: _pex, delete_at: _pdel, ...productRest } = raw.product;
  return {
    ...serviceRest,
    ...productRest,
    ...raw.display,
  } as unknown as Service;
}

export interface ServiceStatus {
  status:
    | "running"
    | "stopped"
    | "stopping"
    | "shutdown"
    | "starting"
    | "installing"
    | "preorder"
    | "createbackup"
    | "restorebackup"
    | "backupplanned"
    | "restoreplanned"
    | "error";
}

export interface ServiceOs {
  id: string;
  displayname: string;
  proxmoxid: number;
  type: string;
}

export interface ServiceIpv4 {
  ip: string;
  gw: string;
  netmask: string;
  rdns: string;
  subnetid: number;
}

export interface ServiceIpv6 {
  firstip: string;
  gw: string;
  netmask: string;
  subnet: string;
  subnetid: number;
}

export interface ServiceIpResponse {
  ipv4: ServiceIpv4[];
  ipv6: ServiceIpv6[];
}

// Keep backward compat alias
export type ServiceIp = ServiceIpv4;

export interface Backup {
  id: string;
  backupname: string;
  displayname: string;
  created_on: string;
  proxmoxid: string;
}

export interface CronJob {
  id: string;
  kvmid: string;
  displayname: string;
  action: "start" | "stop" | "restart";
  expression: string;
  status: number;
  created_on: string;
  nextexecute: string;
}

export interface KvmPacket {
  id: string;
  line: string;
  displayname: string;
  cores: number;
  memory: number;
  disk: number;
  uplink: number;
  traffic: string | number;
  ipv4: number;
  ipv6: number;
  price: string | number;
  firstpayment: string | number;
  discount: string | number;
  discountedprice: string | number;
  ghzbase: string;
  ghzturbo: string;
  active: number;
}

export type KvmLine = KvmPacket[];

export interface Order {
  id: string;
  status: string;
  amount: number;
  paymentMethod: string;
  created: string;
}

export interface LiveData {
  cpu: number;
  mem: number;
  netin: number;
  netout: number;
}

export interface TrafficDay {
  date: string;
  in: number;
  out: number;
}

export interface TrafficData {
  history: {
    last30days: TrafficDay[];
    months: TrafficDay[];
  };
  max: number;
  current: string;
  percentage: string;
  normalpercentage: number;
}

export type PowerAction = "start" | "stop" | "shutdown" | "restart";
