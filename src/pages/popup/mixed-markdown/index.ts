import 'styles/body.scss';


import('./mixed').then(({ init, whenDefined }) => whenDefined().then(() => init()));
