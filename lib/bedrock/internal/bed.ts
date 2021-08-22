import { Block } from 'prismarine-block'
import { Vec3 } from '../util/vec3'
import assert from 'assert'
import { Bot } from '../external/IBot'

module.exports = (bot: Bot, internal) => {
  if (internal.type === 'pc') {
    bot._client.on('game_state_change', (packet) => {
      if (packet.reason === 0) {
        // occurs when you can't spawn in your bed and your spawn point gets reset
        bot.emit('spawnReset')
      }
    })

    return {
      parseBedMetadata (bedBlock) {
        const metadata = {
          part: false, // true: head, false: foot
          occupied: 0,
          facing: 0, // 0: south, 1: west, 2: north, 3 east
          headOffset: new Vec3(0, 0, 1)
        }
    
        if (bot.supportFeature('blockStateId')) {
          const state = bedBlock.stateId - mcData.blocksByStateId[bedBlock.stateId].minStateId
          const bitMetadata = state.toString(2).padStart(4, '0') // FACING (first 2 bits), PART (3rd bit), OCCUPIED (4th bit)
          metadata.part = bitMetadata[3] === '0'
          metadata.occupied = bitMetadata[2] === '0'
    
          switch (bitMetadata.slice(0, 2)) {
            case '00':
              metadata.facing = 2
              metadata.headOffset.set(0, 0, -1)
              break
            case '10':
              metadata.facing = 1
              metadata.headOffset.set(-1, 0, 0)
              break
            case '11':
              metadata.facing = 3
              metadata.headOffset.set(1, 0, 0)
          }
        } else if (bot.supportFeature('blockMetadata')) {
          const bitMetadata = bedBlock.metadata.toString(2).padStart(4, '0') // PART (1st bit), OCCUPIED (2nd bit), FACING (last 2 bits)
          metadata.part = bitMetadata[0] === '1'
          metadata.occupied = bitMetadata[1] === '1'
    
          switch (bitMetadata.slice(2, 4)) {
            case '01':
              metadata.facing = 1
              metadata.headOffset.set(-1, 0, 0)
              break
            case '10':
              metadata.facing = 2
              metadata.headOffset.set(0, 0, -1)
              break
            case '11':
              metadata.facing = 3
              metadata.headOffset.set(1, 0, 0)
          }
        }
    
        return metadata
      }
    }  
  } else if (internal.type === 'bedrock') {

  }
}