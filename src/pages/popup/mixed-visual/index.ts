import 'styles/body.scss';


window.addEventListener('pageshow', () => {
  import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => init()));
});
