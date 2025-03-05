import type Mux from "@mux/mux-node";

export type Status = {
  status: 'preparing' | 'ready' | 'errored';
  errors?: Array<any>;
  playbackId?: string;
};
