import 'styles/body.scss';


// import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => init()));
// document.addEventListener('DOMContentLoaded', () => {
//   import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => init()));
// });
import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => {
  setTimeout(() => {
    init();
  }, 1);
}));
