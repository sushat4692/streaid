export const AutoVerify = async ({ $, directory }) => {
  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return
      const $d = $.cwd(directory)
      await $d`pnpm run format && pnpm run lint && pnpm test`.nothrow()
      await $d`cd src-tauri && cargo test 2>&1`.nothrow()
    },
  }
}
