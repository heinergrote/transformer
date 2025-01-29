import {Component, ElementRef, OnInit, viewChild} from '@angular/core';
import {Application, Container, FederatedPointerEvent, Graphics} from 'pixi.js';

@Component({
  selector: 'app-pixie',
  imports: [],
  templateUrl: './pixie.component.html',
  styleUrl: './pixie.component.css'
})
export class PixieComponent implements OnInit {

  pixiContainer = viewChild.required<ElementRef<HTMLDivElement>>('pixiContainer')

  pixieApp : Application | undefined;
  dragTarget : any;

  constructor() {
  }

  ngOnInit(): void {
    this.initApp().then(value => console.log("Pixi Application Created: ", this.pixieApp))
  }

  async initApp() {
    console.log("Creating Pixi Application")
    const app = new Application();
    await app.init({ background: "#222", width: 400, height: 400 });
    this.pixiContainer().nativeElement.appendChild(app.canvas);

    this.pixieApp = app;

    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    const dots = new Array<Container>();
    for (let x = 0; x <= 10; x++) {
      for (let y = 0; y <= 10; y++) {
        const dot = new Graphics().circle(0, 0, 3).fill(0xff8888);
        dot.position.set(x*40, y*40);
        app.stage.addChild(dot);
        dots.push(dot);
      }
    }

    const srcPoints = new Array<Container>();
    srcPoints.push(this.makeHandle(40, 40));
    srcPoints.push(this.makeHandle(360, 40));
    srcPoints.push(this.makeHandle(360, 360));
    srcPoints.push(this.makeHandle(40, 360));
    app.stage.addChild(...srcPoints);

    app.stage.on('pointerup', this.onDragEnd);
    app.stage.on('pointerupoutside', this.onDragEnd);

  }

  makeHandle(x: number, y: number) {
    const handle = new Graphics().circle(0, 0, 10).fill(0xffffff);
    handle.position.set(x, y);
    handle.eventMode = 'dynamic';
    handle.cursor = 'pointer';
    handle.on('pointerdown', this.onPointerDown)
    return handle
  }

  onPointerDown = (event: FederatedPointerEvent) => {
    this.dragTarget = event.target;
    this.dragTarget.alpha = 0.5;
    this.pixieApp!.stage.on('pointermove', this.onDragMove)
  }

  onDragMove= (event: FederatedPointerEvent) => {
    if (this.dragTarget) {
      this.dragTarget.parent.toLocal(event.global, null, this.dragTarget.position);
    }
  }

  onDragEnd = (event: FederatedPointerEvent)=> {
    if (this.dragTarget) {
      this.pixieApp!.stage.off('pointermove', this.onDragMove);
      this.dragTarget.alpha = 1;
      this.dragTarget = null;
    }
  }

}
