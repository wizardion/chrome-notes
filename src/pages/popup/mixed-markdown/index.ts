import 'styles/body.scss';


import('./popup').then(({ init, whenDefined }) => whenDefined().then(() => init()));
