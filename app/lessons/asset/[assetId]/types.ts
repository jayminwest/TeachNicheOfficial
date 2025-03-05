export type Status = {
  status: 'preparing' | 'ready' | 'errored';
  errors?: Array<{ message: string } | string>;
  playbackId?: string;
};
