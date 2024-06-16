import 'styles/body.scss';


// import('./mixed').then(({ init, whenDefined }) => whenDefined().then(() => init()));
// document.addEventListener('DOMContentLoaded', () => {
// window.addEventListener('load', () => {
//   // import('./mixed').then(({ init, whenDefined }) => whenDefined().then(() => init()));
//   setTimeout(() => {
//     import('./mixed').then(({ init, whenDefined }) => whenDefined().then(() => init()));
//   }, 400);
// });
import('./mixed').then(({ init, whenDefined }) => whenDefined().then(() => {
  setTimeout(() => {
    init();
  }, 1);
}));
