import { Bot } from "./IBot";

module.exports = (bot: Bot, opt, internal) => {
  const { inventory: { Transaction } } = internal

  bot.inventory ??= {}
  bot.inventory.startTransaction = () => new Transaction()

  bot.activateBlock
  bot.activateEntity
  bot.activateEntityAt
  bot.consume

  bot.activateItem
  bot.deactivateItem

  // Simple Inventory
  bot.toss = async (itemTypeOrName: number | string, metadata: number, count: number) => {
    
  }
}