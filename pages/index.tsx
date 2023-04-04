import Head from 'next/head'
// import Image from 'next/image'
import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import { io } from 'socket.io-client'
import { useEffect, useState, useRef } from 'react'
import { useContext } from 'react'
import { bucket } from '@/mongodb'
import Gallery from '@/components/allimages'
import Link from 'next/link'

function Whiteboard() {
  const [socket, setSocket] = useState(io("http://localhost:4000",{
            transports : ['websocket']
        }));
  const [fileId, setFileId] = useState('');
  const [undoList, setUndoList] = useState([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousStatesRef = useRef<ImageData[]>([]);
  const currentCanvasStateRef = useRef<ImageData | null>(null);
  let shouldClearCanvas: boolean = false;

  
  const handleUpload = async () => {
    const canvas = document.getElementById('my-canvas') as HTMLCanvasElement;
    const dataUrl = canvas.toDataURL('image/png');
    console.log(dataUrl)
    const img = new Image();
    img.src = dataUrl;
    document.body.appendChild(img);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    });
    const { fileId } = await response.json();
    setFileId(fileId);
  };

  console.log("helllo",fileId)

  const colorsArray = ['crimson', 'aquamarine', 'purple', 'rebeccapurple', 
    'yellowgreen', 'wheat', 'springgreen', 'yellow', 'slategray', 'slateblue', 'orangered', 'lightskyblue', 'deeppink', 'darkviolet', 'darkcyan']
  // shuffle the array randomly
  // colorsArray.sort(() => Math.random() - 0.5);
  // get the first five elements from the shuffled array
  const colorDivs = colorsArray.map((color, index) => (
    <div key={color} className={`color ${color}`} style={{ backgroundColor: color }} />
  ));


  interface DrawingData {
    x: number;
    y: number;
    color: string;
    lineWidth: number;
  }
  

  useEffect(() => {

    var canvas = document.getElementsByClassName('whiteboard')[0] as HTMLCanvasElement;
    // const canvas = canvasRef.current;
    var colors = document.getElementsByClassName('color');
    const lineWidthSlider = document.getElementById('line-width-slider') as HTMLInputElement;
    const clearCanvasButton = document.getElementById('clear-canvas-button') as HTMLButtonElement;
    const undoButton = document.getElementById('undo-button') as HTMLButtonElement;
    var context = canvas.getContext('2d');

    
    // console.log('UNDO LIST:', undoList);

    const current: DrawingData = {
      x: 0,
      y: 0,
      color: 'black',
      lineWidth: 25
    };
    var drawing = false;

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
    
    //Touch support for mobile devices
    canvas.addEventListener('touchstart', onMouseDown, false);
    canvas.addEventListener('touchend', onMouseUp, false);
    canvas.addEventListener('touchcancel', onMouseUp, false);
    canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

    lineWidthSlider.addEventListener('input', onSliderUpdate);
    clearCanvasButton.addEventListener('click', clearCanvas);

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i] as HTMLElement;
      color.addEventListener('click', onColorUpdate);
    }

    // socket.on('canvasData', sendCanvas);
    socket.on('drawing', onDrawingEvent);

    window.addEventListener('resize', onResize, false);
    onResize();

    function drawLine(x0: number, y0: number, x1: number, y1: number, color: string, lineWidth: number, emit: boolean) {
      console.log('line width:', lineWidth);
      console.log('color:', color);
      console.log("should Clear", shouldClearCanvas)
      
      if (!context) {
        return;
      }

      if (shouldClearCanvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        shouldClearCanvas = false; // reset the flag to false
      }
      
      context.strokeStyle = color;
      context.lineWidth = lineWidth; // Use the lineWidth argument
      context.lineJoin = context.lineCap = 'round';

      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.stroke();

      context.moveTo(x0 - 4, y0 - 4);
      context.lineTo(x1 - 4, y1 - 4);
      context.stroke();
      
      context.moveTo(x0 - 2, y0 - 2);
      context.lineTo(x1 - 2, y1 - 2);
      context.stroke();
      
      context.moveTo(x0 + 2, y0 + 2);
      context.lineTo(x1 + 2, y1 + 2);
      context.stroke();
      
      context.moveTo(x0 + 4, y0 + 4);
      context.lineTo(x1 + 4, y1 + 4);
      context.stroke();

      // context.stroke();
      context.closePath();

      if (!emit) { return; }
      var w = canvas.width;
      var h = canvas.height;

      socket.emit('drawing', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color,
        lineWidth: lineWidth
      });

      // if (emit) { 
      //   var w = canvas.width;
      //   var h = canvas.height;
      //   socket.emit('drawing', {
      //     x0: x0 / w,
      //     y0: y0 / h,
      //     x1: x1 / w,
      //     y1: y1 / h,
      //     color: color,
      //     lineWidth: lineWidth
      //   });

      //   // Add line to undo list
      //   const line = {
      //     x0: x0 / w,
      //     y0: y0 / h,
      //     x1: x1 / w,
      //     y1: y1 / h,
      //     color: color,
      //     lineWidth: lineWidth
      //   };
      //   socket.emit('addLineToUndoList', line);
      // }
      
    }

    function onMouseDown(e: MouseEvent | TouchEvent) {
      if (e instanceof MouseEvent) {
        current.x = e.clientX;
        current.y = e.clientY;
      } else {
        current.x = e.touches[0].clientX;
        current.y = e.touches[0].clientY;
      }

      const initialCanvasState = context.getImageData(0, 0, canvas.width, canvas.height);
      previousStatesRef.current.push(initialCanvasState);
      currentCanvasStateRef.current = initialCanvasState;
      
      drawing = true;
    }

    function onMouseUp(e: MouseEvent | TouchEvent) {
    if (!drawing) {
      return;
    }
    drawing = false;

      // // add new state to undoList
      // const currentState = context.getImageData(0, 0, canvas.width, canvas.height);
      // setUndoList(undoList => {
      //   const newUndoList = [...undoList, currentState];
      //   return newUndoList;
      // });

    drawLine(current.x, current.y, (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX, 
            (e as MouseEvent).clientY || (e as TouchEvent).touches[0].clientY, current.color, current.lineWidth, true);

    // For storing each line on server
    // const line = {
    //   x1: current.x,
    //   y1: current.y,
    //   x2: (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX,
    //   y2: (e as MouseEvent).clientY || (e as TouchEvent).touches[0].clientY,
    //   color: current.color,
    //   lineWidth: current.lineWidth,
    //   };
          
    // socket.emit('addLineToUndoList', line);
  }

    function onMouseMove(e: MouseEvent | TouchEvent){
      if (!drawing) { return; }
      if (e instanceof MouseEvent) {
        const { clientX, clientY } = e;
        drawLine(current.x, current.y, clientX, clientY, current.color, current.lineWidth, true);
        current.x = clientX;
        current.y = clientY;
      } else {
        const { clientX, clientY } = e.touches[0];
        drawLine(current.x, current.y, clientX, clientY, current.color, current.lineWidth, true);
        current.x = clientX;
        current.y = clientY;
      }
    }

    function onColorUpdate(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const color = target.classList[1];
      current.color = color;
      console.log(current.color)
    }

    function onSliderUpdate(event: Event): void {
      const target = event.target as HTMLInputElement;
      const lineWidth = parseFloat(target.value);
      current.lineWidth = lineWidth
      console.log(current.lineWidth)
      // setLineWidth(current.lineWidth);
    }

    function clearCanvas() {
      // Get the canvas and context
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
    
      // If either canvas or context is null, return early
      if (!canvas || !context) {
        return;
      }
    
      // Clear the canvas on the frontend
      context.clearRect(0, 0, canvas.width, canvas.height);
    
      // Emit an event to clear the canvas on other clients
      socket.emit('clearCanvas');
    
      // Set the shouldClearCanvas flag to true
      shouldClearCanvas = true;
    }
    
    // Listen for the 'clearCanvas' event on the socket
    socket.on('clearCanvas', () => {
      // Get the canvas and context
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
    
      // If either canvas or context is null, return early
      if (!canvas || !context) {
        return;
      }
    
      // Clear the canvas on the frontend
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    // limit the number of events per second
    function throttle<T extends any[]>(callback: (...args: T) => void, delay: number): (...args: T) => void {
      let previousCall = new Date().getTime();
      return function(...args: T) {
        const time = new Date().getTime();
    
        if ((time - previousCall) >= delay) {
          previousCall = time;
          callback.apply(null, args);
        }
      };
    }

    interface DrawingEventData {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      color: string;
      lineWidth: number;
      boolean: true,
    }

    function onDrawingEvent(data: DrawingEventData): void {
      var w = canvas.width;
      var h = canvas.height;
      drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.lineWidth, data.boolean);
    }

    // make the canvas fill its parent
    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
      
  }, []);

  function handleUndo(): void {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    if (previousStatesRef.current.length > 0) {
      // Restore the previous canvas state
      const previousCanvasState = previousStatesRef.current.pop()!;
      context.putImageData(previousCanvasState, 0, 0);

      // Update the current canvas state
      currentCanvasStateRef.current = context.getImageData(0, 0, canvas.width, canvas.height);

      // socket.emit('undo', { previousCanvasState, currentCanvasState: currentCanvasStateRef.current });
    }
    console.log("prev",previousStatesRef)
    console.log('current', currentCanvasStateRef)
  }

  // socket.on('undo', () => {
  //   handleUndo();
  // })




  return (
  <div className="whiteboard-container">
    <canvas className="whiteboard" id="my-canvas" ref={canvasRef}></canvas>
    <div className="colors">
      <div className='color black' style={{ backgroundColor: 'black' }}></div>
      {colorDivs}
      <div className='color white' style={{ backgroundColor: 'white' }}></div>
      <label>Brush Width </label>
      <input
        id='line-width-slider'
        type="range"
        min="3"
        max="100"
      />
      <div>
        <button id='undo-button' onClick={handleUndo}>Undo</button>
        <button id="clear-canvas-button">Clear Canvas</button>
        <button onClick={handleUpload}>Save to Gallery</button>
        {fileId && (
          <img src={`/api/upload/${fileId}`} alt="Drawing" />
        )}
      </div>
      <Link href="/gallery">Gallery Page</Link>
    </div>
    <Gallery />
  </div>
  );
  }
  
  export default Whiteboard;