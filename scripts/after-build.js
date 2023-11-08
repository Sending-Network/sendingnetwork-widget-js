/*
 * @Description: description
 * @Author: illuSioN4ng
 * @Date: 2021-11-04 18:13:22
 * @LastEditors: illuSioN4ng
 * @LastEditTime: 2021-11-04 18:22:27
 */
const shell = require('shelljs')
// console.log('start to remove old webapp')
// shell.rm('-rf', '../futurecoursewareqtplayer/bin/release/xdfplugins/activeScene')
console.log('start to copy new activeScene')
// shell.cp('-Rf', './dist/*', '../futurecoursewareqtplayer/bin/release/xdfplugins/activeScene')
shell.cp('-Rf', './build/*', '../partner/w3w-polygon-scan/static/js')
shell.cp('-Rf', './build/*', '../partner/w3w-scan/src/assets/js')
shell.cp('-Rf', './build/*', '../sdn-demo/public')
console.log('pack success!')
