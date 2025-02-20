declare module 'mux-embed' {
  namespace utils {
    function now(): number;
  }

  function monitor(selector: string, options: {
    debug?: boolean;
    data: {
      env_key: string;
      player_name?: string;
      player_init_time?: number;
      video_id?: string;
      video_title?: string;
      video_stream_type?: string;
      [key: string]: any;
    };
  }): void;

  export { monitor, utils };
}
