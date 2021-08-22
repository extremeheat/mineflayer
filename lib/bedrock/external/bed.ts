import assert from 'assert'
import { Vec3 } from 'vec3'
import { Bot } from './IBot'
import { Block } from 'prismarine-block'

const BEDS = ['white_bed', 'orange_bed', 'magenta_bed', 'light_blue_bed', 'yellow_bed', 'lime_bed', 'pink_bed', 'gray_bed',
'light_gray_bed', 'cyan_bed', 'purple_bed', 'blue_bed', 'brown_bed', 'green_bed', 'red_bed', 'black_bed', 'bed']

const CARDINAL_DIRECTIONS = ['south', 'west', 'north', 'east']

module.exports = async (bot: Bot, internal) => {
  const {
    bed: { parseBedMetadata, sleep },
    interact: { canInteractWithBlock }
  } = internal

  bot.isABed = block => BEDS.includes(block.name)

  function canSleep (atBlock: Block): string | true {
    assert(atBlock.stateId, 'invalid bed block')
    const thunderstorm = bot.isRaining && (bot.thunderState > 0)
    if (!thunderstorm && !(bot.time.timeOfDay >= 12541 && bot.time.timeOfDay <= 23458)) return "it's not night and it's not a thunderstorm"
    if (bot.isSleeping) return 'already sleeping'
    if (!bot.isABed(atBlock)) return 'wrong block : not a bed block'
    if (!canInteractWithBlock(atBlock)) return 'cannot sleep on block'

    // Check block configuration
    const botPos = bot.entity.position.floored()
    const metadata = parseBedMetadata(atBlock)

    const headPoint = atBlock.position
    const clickRange = [2, -3, -3, 2] // [south, west, north, east]
    const monsterRange = [7, -8, -8, 7]
    const oppositeCardinal = (metadata.facing + 2) % CARDINAL_DIRECTIONS.length

    if (clickRange[oppositeCardinal] < 0) {
      clickRange[oppositeCardinal]--
    } else {
      clickRange[oppositeCardinal]++
    }

    const nwClickCorner = headPoint.offset(clickRange[1], -2, clickRange[2]) // North-West lower corner
    const seClickCorner = headPoint.offset(clickRange[3], 2, clickRange[0]) // South-East upper corner
    if (botPos.x > seClickCorner.x || botPos.x < nwClickCorner.x || botPos.y > seClickCorner.y || botPos.y < nwClickCorner.y || botPos.z > seClickCorner.z || botPos.z < nwClickCorner.z) {
      throw new Error('the bed is too far')
    }

    if (bot.gameMode !== 'creative' || bot.supportFeature('creativeSleepNearMobs')) { // If in creative mode the bot should be able to sleep even if there are monster nearby (starting in 1.13)
      const nwMonsterCorner = headPoint.offset(monsterRange[1], -6, monsterRange[2]) // North-West lower corner
      const seMonsterCorner = headPoint.offset(monsterRange[3], 4, monsterRange[0]) // South-East upper corner

      for (const key of Object.keys(bot.entities)) {
        const entity = bot.entities[key]
        if (entity.kind === 'Hostile mobs') {
          const entityPos = entity.position.floored()
          if (entityPos.x <= seMonsterCorner.x && entityPos.x >= nwMonsterCorner.x && entityPos.y <= seMonsterCorner.y && entityPos.y >= nwMonsterCorner.y && entityPos.z <= seMonsterCorner.z && entityPos.z >= nwMonsterCorner.z) {
            return 'there are monsters nearby'
          }
        }
      }
    }

    return true
  }

  bot.sleep = async (bedBlock: Block) => {
    const sleepable = await canSleep(bedBlock)
    if (sleepable === true) {
      return await sleep(bedBlock)
    }
    throw Error(sleepable)
  }


  bot.on('entitySleep', (entity) => {
    if (entity === bot.entity) {
      bot.isSleeping = true
      bot.emit('sleep')
    }
  })

  bot.on('entityWake', (entity) => {
    if (entity === bot.entity) {
      bot.isSleeping = false
      bot.emit('wake')
    }
  })

  internal.test.sleep = async (test) => {
    test.configure({ depend: [] })
    await test.onJoin(async bot => {
      const pos = await test.placeBlock('bed')
      const block = await bot.blockAt(pos)
      assert(await bot._canSleep(block))
      assert(await bot.sleep(block))
    })
  }
}