export type Status = {
  status: 'preparing' | 'ready' | 'errored';
  errors?: Array<any>;
  playbackId?: string;
};
