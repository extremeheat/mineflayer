import type { Block } from "prismarine-block"
import type { Item } from "prismarine-item"

module.exports = (bot, internal) => {
  const Item = require('prismarine-item')(bot.version)

  class Anvil extends internal.anvil.Anvil {
    async combine (itemOne: Item, itemTwo: Item) {

    }
  }

  bot.openAnvil = async (anvilBlock: Block) => {

  }
}
