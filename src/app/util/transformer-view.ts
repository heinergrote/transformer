import {Application, FederatedPointerEvent, Graphics} from 'pixi.js';
import {identityMatrix, TransformMatrix} from './homography';

interface XY {x:number, y:number}

export class TransformerView {

  public ready: Promise<any>;
  public app: Application;

  private destCircles: Graphics[] = []
  private srcCircles: Graphics[] = []
  private dragTarget : any;
  private dragSrc : boolean = false;

  private inputs: XY[] = []
  private outputDots: Graphics[] = []

  private srcPoints: XY[] = []
  private destPoints: XY[] = []

  private readonly onSrcPointsChangeCallback: (xys: XY[]) => void;
  private readonly onDestPointsChangeCallback: (xys: XY[]) => void;

  constructor(onSrcPointsChange: (xys: XY[]) => void,
              onDestPointsChange: (xys: XY[]) => void) {
    this.app = new Application();
    this.ready = this.initApp();
    this.onSrcPointsChangeCallback = onSrcPointsChange;
    this.onDestPointsChangeCallback = onDestPointsChange
  }

  private async initApp() {

    await this.app.init({ background: "#e5e7eb", width: 400, height: 400, antialias: true});
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerup', this.onDragEnd);
    this.app.stage.on('pointerupoutside', this.onDragEnd);
    //app.ticker.add((ticker) => {
    //  console.log("tick", ticker.deltaMS)
    //});

    const outputPadding = 400;
    const outputSize = 400;
    const outputStep = 20;

    this.inputs = []
    for (let x = -outputPadding; x <= outputSize + outputPadding; x += outputStep) {
      for (let y = -outputPadding; y <= outputSize + outputPadding; y += outputStep) {
        this.inputs.push({x,y})
      }
    }
    this.outputDots = this.inputs.map(
      (_) => {
        return this.app.stage.addChild(new Graphics().circle(0,0, 2).fill(0x000000));
      }
    )

  }

  appendTo(element: HTMLElement) {
    element.appendChild(this.app.canvas)
  }


  initPoints(srcPoints: XY[], destPoints: XY[]) {

    this.app.stage.removeChild(...this.srcCircles)
    this.app.stage.removeChild(...this.destCircles)
    this.srcPoints = srcPoints.slice()
    this.destPoints = destPoints.slice()

    this.srcCircles = this.srcPoints.map(point => {
      const cross = this.makeCross()
      this.app.stage.addChild(cross)
      cross.position.set(point.x, point.y)
      return cross
    })

    this.destCircles = this.destPoints.map(point => {
      const handle = this.makeHandle()
      this.app.stage.addChild(handle)
      handle.position.set(point.x, point.y)
      return handle
    })

    this.applyTransformation(identityMatrix)
  }

  updateSrcPoints(xys: {x:number, y:number}[]) {
    const newPoints = xys.map((xy) => ({x: xy.x, y: xy.y} as XY))
    if (newPoints.length !== this.srcPoints.length) {
      this.initPoints(newPoints, newPoints)
    } else {
      this.srcPoints = newPoints
      newPoints.forEach((point, index) => {
        this.srcCircles[index].position.set(point.x, point.y)
      })
    }
  }

  updateDestPoints(xys: {x:number, y:number}[]) {
    const newPoints = xys.map((xy) => ({x: xy.x, y: xy.y} as XY))
    if (newPoints.length === this.destPoints.length) {
      this.destPoints = newPoints
      newPoints.forEach((point, index) => {
        this.destCircles[index].position.set(point.x, point.y)
      })
    }
  }


  applyTransformation(tm: TransformMatrix) {

    const outputs = this.inputs.map((input) => {
      const [x, y] = [input.x, input.y]
      const {a,b,c,d,e,f,g, h} = {...tm}
      return {
        x: (a*x+b*y+c) / (g*x+h*y+1),
        y: (d*x+e*y+f) / (g*x+h*y+1)
      } as XY
    })
    outputs.forEach((point, index) => {
      this.outputDots[index].position.set(point.x, point.y)
    })
  }


  makeHandle() {
    const handle = new Graphics().circle(0, 0, 10).fill(0xFF0000).stroke(0x000000);
    handle.alpha = 0.5
    handle.eventMode = 'dynamic';
    handle.cursor = 'pointer';
    handle.on('pointerdown', this.onDstPointerDown)
    return handle
  }

  makeCross() {
    const cross = new Graphics()
      .moveTo(-10, 0).lineTo(-2,0)
      .moveTo(2, 0).lineTo(10,0)
      .moveTo(0, -10).lineTo(0,-2)
      .moveTo(0, 2).lineTo(0,10)
      .circle(0,0, 16)
      .fill({color: 0xFF0000, alpha: 0})
      .stroke(0x000000);
    cross.eventMode = 'dynamic';
    cross.cursor = 'pointer';
    cross.on('pointerdown', this.onSrcPointerDown)
    return cross
  }

  onSrcPointerDown = (event: FederatedPointerEvent) => {
    this.dragTarget = event.target;
    this.dragSrc = true;
    this.app.stage.on('pointermove', this.onDragMove)
  }
  onDstPointerDown = (event: FederatedPointerEvent) => {
    this.dragTarget = event.target;
    this.dragSrc = false;
    this.app.stage.on('pointermove', this.onDragMove)
  }

  onDragMove= (event: FederatedPointerEvent) => {
    if (this.dragTarget) {
      this.dragTarget.parent.toLocal(event.global, null, this.dragTarget.position);

      if (this.dragSrc) {
        this.srcPoints = this.srcCircles.map((circle) => (
          {
            x: Math.round(circle.position.x),
            y: Math.round(circle.position.y)
          } as XY
        ))
        this.onSrcPointsChangeCallback(this.srcPoints)
      } else {
        this.destPoints = this.destCircles.map((circle) => (
          {
            x: Math.round(circle.position.x),
            y: Math.round(circle.position.y)
          } as XY
        ))
        this.onDestPointsChangeCallback(this.destPoints)
      }

    }
  }

  onDragEnd = (_: FederatedPointerEvent)=> {
    if (this.dragTarget) {
      this.app.stage.off('pointermove', this.onDragMove);
      this.dragTarget = null;
    }
  }

}
