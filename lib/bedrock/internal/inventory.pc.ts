import assert from 'assert'
import { once } from 'events'
import { sleep } from '../../promise_utils'
import { Bot } from '../external/IBot'

// ms to wait before clicking on a tool so the server can send the new
// damage information
const DIG_CLICK_TIMEOUT = 500

module.exports = (bot: Bot, opt, internal) => {
  const Item = require('prismarine-item')(bot.version)
  const windows = require('prismarine-windows')(bot.version)

  const windowClickQueue = []

  let nextRequestId = 0
  let nextActionNumber = 0

  class Transaction {
    windows

    // take from slot and put count into hand
    take(options: { from?: string, fromSlot?: number, count?: number })
    // take item from slot and put count into hand
    take(options: { from?: string, item?: ItemName, count?: number })
    // place from hand to slot specific if slot is specified, else distribute
    take(options) {
      assert.ok(!bot.inventory.selectedItem, 'already have a selected item')
      if (options.from) {
        
      }
    }

    // place({ toSlot?: number, count?: number })
    // // move from slot to another slot
    // move({ from?: string, fromSlot?: number, to?: string, toSlot?: number })
    // // from item from one place to another place (specific slot if specified)
    // move({ from?: string, item?: number, to?: string, toSlot?: number })
  }

  function createActionNumber () {
    nextActionNumber = nextActionNumber === 32767 ? 1 : nextActionNumber + 1
    return nextActionNumber
  }

  function updateHeldItem () {
    bot.heldItem = bot.inventory.slots[internal.QUICK_BAR_START + bot.quickBarSlot]
    bot.entity.heldItem = bot.heldItem
    bot.emit('heldItemChanged', bot.entity.heldItem)
  }

  function confirmTransaction (windowId, actionId, accepted) {
    // drop the queue entries for all the clicks that the server did not send
    // transaction packets for.
    let click = windowClickQueue.shift()
    if (click === undefined) {
      if (!opt.hideErrors) {
        console.log(`WARNING : unknown transaction confirmation for window ${windowId}, action ${actionId} and accepted ${accepted}`)
      }
      return
    }
    assert.ok(click.id <= actionId)
    while (actionId > click.id) {
      onAccepted()
      click = windowClickQueue.shift()
    }
    assert.ok(click)

    if (accepted) {
      onAccepted()
    } else {
      onRejected()
    }
    updateHeldItem()

    function onAccepted () {
      const window = windowId === 0 ? bot.inventory : bot.currentWindow
      if (!window || window.id !== click.windowId) return
      window.acceptClick(click)
      bot.emit(`confirmTransaction${click.id}`, true)
    }

    function onRejected () {
      bot._client.write('transaction', {
        windowId: click.windowId,
        action: click.id,
        accepted: true
      })
      bot.emit(`confirmTransaction${click.id}`, false)
    }
  }

  bot.clickWindow = async (slot, mouseButton, mode) => {
    // if you click on the quick bar and have dug recently,
    // wait a bit
    if (slot >= internal.QUICK_BAR_START && bot.lastDigTime != null) {
      let timeSinceLastDig
      while ((timeSinceLastDig = Date.now() - bot.lastDigTime) < DIG_CLICK_TIMEOUT) {
        await sleep(DIG_CLICK_TIMEOUT - timeSinceLastDig)
      }
    }
    const window = bot.currentWindow || bot.inventory

    assert.ok(mouseButton === 0 || mouseButton === 1)
    assert.strictEqual(mode, 0)
    const actionId = createActionNumber()

    const click = {
      slot,
      mouseButton,
      mode,
      id: actionId,
      windowId: window.id,
      item: slot === -999 ? null : window.slots[slot]
    }
    windowClickQueue.push(click)
    bot._client.write('window_click', {
      windowId: window.id,
      slot,
      mouseButton,
      action: actionId,
      mode,
      item: Item.toNotch(click.item)
    })

    const response = once(bot, `confirmTransaction${actionId}`)

    // notchian servers are assholes and only confirm certain transactions.
    if (!window.transactionRequiresConfirmation(click)) {
      // jump the gun and accept the click
      confirmTransaction(window.id, actionId, true)
    }

    const [success] = await response
    if (!success) {
      throw new Error(`Server rejected transaction for clicking on slot ${slot}, on window ${JSON.stringify(window.slots, null, 2)}.`)
    }
  }

  return {
    Transaction
  }
}