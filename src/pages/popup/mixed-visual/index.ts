import 'styles/body.scss';


// import('./mixed-visual').then(({ init, whenDefined }) => whenDefined().then(() => init()));
// document.addEventListener('DOMContentLoaded', () => {
//   import('./mixed-visual').then(({ init, whenDefined }) => whenDefined().then(() => init()));
// });
import('./mixed-visual').then(({ init, whenDefined }) => whenDefined().then(() => {
  setTimeout(() => {
    init();
  }, 1);
}));
