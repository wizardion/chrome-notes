import 'styles/body.scss';


// import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => init()));
// document.addEventListener('DOMContentLoaded', () => {
// window.addEventListener('load', () => {
//   // import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => init()));


//   import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => {
//     setTimeout(() => {
//       init();
//     }, 1);
//   }));
// });

import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => {
  setTimeout(() => {
    init();
  }, 1);
}));

// setTimeout(() => import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => init())), 1);
