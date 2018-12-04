module.exports = async function () {
  console.log('enter dapp init')

  app.events.on('newBlock', (block) => {
    console.log('new block received', block.height)
  })
}