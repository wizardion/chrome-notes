import {IControls} from './controls'

export class Base {
  private controls: IControls;

  constructor(elements: IControls) {
    this.controls = elements;

    console.log({
      'add': this.controls.add
    });

    // this.controls

    // this.controls = controls;

    // console.log({
    //   'add': this.controls.add
    // });
    
    /* this.controls = {
      add: controls.add,
      delete: controls.delete,
      template: controls.template,
      listView: controls.listView,
      detailsView: controls.detailsView,
      title: controls.title,
      listControls: controls.listControls
    }; */
  }
}