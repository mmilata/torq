import { Tag } from "pages/tags/tagsTypes";

type Channel = {
  alias: string;
  channelId: number;
  channelPoint: string;
  pubKey: string;
  shortChannelId: string;
  isOpen: boolean;
  capacity: number;
};

type Balance = {
  date: string;
  inboundCapacity: number;
  outboundCapacity: number;
  capacityDiff: number;
};

type ChannelBalance = {
  channelId: number;
  balances: Balance[];
};

type HistoryRecord = {
  alias: string;
  date: string;
  amountOut: number;
  amountIn: number;
  amountTotal: number;
  revenueOut: number;
  revenueIn: number;
  revenueTotal: number;
  countOut: number;
  countIn: number;
  countTotal: number;
};

type Rebalancing = {
  amountMsat: number;
  totalCostMsat: number;
  splitCostMsat: number;
  count: number;
};

type Event = {
  date: string;
  datetime: string;
  fundingTransactionHash: string;
  fundingOutputIndex: number;
  shortChannelId: string;
  type: string;
  isOutbound: boolean;
  announcingPubKey: string;
  value: number;
  previousValue: number;
};

export type ChannelHistory = {
  label: string;
  tags: Tag[];
  onChainCost: number;
  rebalancingCost: number;
  amountOut: number;
  amountIn: number;
  amountTotal: number;
  revenueOut: number;
  revenueIn: number;
  revenueTotal: number;
  countOut: number;
  countIn: number;
  countTotal: number;
  rebalancing: Rebalancing;
  channels: Channel[];
  channelBalances: ChannelBalance[];
  history: HistoryRecord[];
  events: Event[];
};
