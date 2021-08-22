import { Item } from "prismarine-item";
import { Bot } from "../external/IBot";

module.exports = (bot: Bot, internal) => {
  if (internal.type === 'bedrock') {
    return {
      combine(input1: Item, input2: Item) {
        const tx = bot.inventory.startTransaction()
        tx.bedrock.addAction({ type_id: 'optional', recipe_network_id: 0, filtered_string_index: 0 })
        tx.bedrock.addAction({ type_id: 'consume', count: 33, source: { slot_type: 'anvil_input', slot: 1, stack_id: 6 } })
        tx.bedrock.addAction({ type_id: 'place', recipe_network_id: 0, filtered_string_index: 0 })
        const payload = tx.save()
        payload.custom_names = []
        bot._client.write('item_stack_request', payload)
      }
    }
  }
}