import type { PageLoad } from "./$types"

export const load = ({ params }: PageLoad) => {
  return {
    channel: params.channel
  }
}