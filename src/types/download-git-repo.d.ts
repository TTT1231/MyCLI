declare module 'download-git-repo' {
  function download(
    repository: string,
    destination: string,
    options: boolean | { clone?: boolean; headers?: Record<string, string> },
    callback?: (error?: Error) => void
  ): void;

  function download(
    repository: string,
    destination: string,
    callback?: (error?: Error) => void
  ): void;

  export = download;
}