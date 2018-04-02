import { spawn, all } from 'redux-saga/effects'

import sync from './sync'

export default function*() {
  yield all([
    spawn(sync)
  ])
  
  // connectToRemote()
  //   .then(remote => {
  //     setInterval(() => {
  //       const payload = {
  //         id: 'test',
  //         component: 'Text',
  //         children: 'aaaa',
  //         style: {
  //           backgroundColor: _.first(_.shuffle(['blue', 'red', 'green', 'yellow']))
  //         },
  //         position: {
  //           zIndex: 1,
  //           top: 60,
  //           left: 60
  //         }
  //       }
  //       remote.emit('removeWidget', payload)
  //       remote.emit('addWidget', payload)
  //     }, 1000)
  //   })
}