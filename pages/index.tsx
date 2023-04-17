// require('dotenv').config();

import Head from 'next/head'
// import Image from 'next/image'
import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import { io } from 'socket.io-client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import Pusher from 'pusher-js'

// https://draw-together-app.vercel.app:4000 //


function Whiteboard() {
  const [socket, setSocket] = useState(io("https://draw-together-app.vercel.app:4000",{
            transports : ['websocket']
        }));
  const [fileId, setFileId] = useState('');
  const [undoList, setUndoList] = useState([]);
  const [lineWidth, setLineWidth] = useState(25)
  const [color, setColor] = useState('black')
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);

  const [show, setShow] = useState(false)
  const [showCover, setShowCover] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isOptMenuOpen, setIsOptMenuOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousStatesRef = useRef<ImageData[]>([]);
  const currentCanvasStateRef = useRef<ImageData | null>(null);

  const shouldClearCanvasRef = useRef(false);
  // let shouldClearCanvas: boolean = false;
  const router = useRouter();

  const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER ?? '',
  });
  console.log(pusher)
  const channel = pusher.subscribe('scribble-lounge');
  channel.bind('new-line', function(data:{message:string}) {
    console.log('Received message:', data.message);
  });

  interface PushData {
    message: string;
  }

  function pushData(data: PushData) {
    fetch('/api/pusher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  }
  
  const handleUpload = async () => {
    const canvas = document.getElementById('my-canvas') as HTMLCanvasElement;
    const dataUrl = canvas.toDataURL('image/png');
    console.log(dataUrl)

    const name = (document.getElementById('name-input') as HTMLInputElement).value;
    const title = (document.getElementById('title-input') as HTMLInputElement).value;

    const img = new Image();
    img.src = dataUrl;
    // document.body.appendChild(img);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, name, title }),
    });
    const { fileId } = await response.json();
    setFileId(fileId);
    router.push('/gallery')
  };

  // Get colors //
  const colorsArray = ['black', 'crimson', 'aquamarine', 'purple', 'rebeccapurple', 
    'yellowgreen', 'wheat', 'springgreen', 'yellow', 'slategray', 'dodgerblue', 'orangered',
     'lightskyblue', 'deeppink', 'darkviolet', 'darkcyan', 'peru', 'tomato', 'turquoise', 'white']
  const colorDivs = colorsArray.map((color, index) => (
    <div 
      key={color} 
      className={`color ${color} ${index === selectedColorIndex ? 'selected' : ''}`} 
      style={{ backgroundColor: color }}
      onClick={() => setSelectedColorIndex(index)}
    />
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
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

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

    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
    });
    
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
    });

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
      // console.log('line width:', lineWidth);
      // console.log('color:', color);
      
      
      if (!context) {
        return;
      }

      if (shouldClearCanvasRef.current) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        shouldClearCanvasRef.current = false; // reset the flag to false
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

      console.log(socket)

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

    let clientX = (e as MouseEvent).clientX;
    let clientY = (e as MouseEvent).clientY;
    
    if (!clientX && (e as TouchEvent).changedTouches) {
      clientX = (e as TouchEvent).changedTouches[0].clientX;
    }
    
    if (!clientY && (e as TouchEvent).changedTouches) {
      clientY = (e as TouchEvent).changedTouches[0].clientY;
    }
  
    drawLine(current.x, current.y, clientX, clientY, current.color, current.lineWidth, true);
    pushData({ message: 'line drawn' });
    // drawLine(current.x, current.y, (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX, 
    //         (e as MouseEvent).clientY || (e as TouchEvent).touches[0].clientY, current.color, current.lineWidth, true);
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
      // console.log(current.color)
      setColor(current.color)
    }

    function onSliderUpdate(event: Event): void {
      const target = event.target as HTMLInputElement;
      const lineWidth = parseFloat(target.value);
      current.lineWidth = lineWidth
      // console.log(current.lineWidth)
      setLineWidth(current.lineWidth);
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
      shouldClearCanvasRef.current = true;
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
      
  }, [socket]);

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
    // console.log("prev",previousStatesRef)
    // console.log('current', currentCanvasStateRef)
  }

  // socket.on('undo', () => {
  //   handleUndo();
  // })

  function toPNG() {
    const canvas = canvasRef.current;
    if(!canvas) {
      return;
    }
    const link = document.createElement('a');
    link.download = 'canvas.png';
    canvas.toBlob(function(blob) {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'canvas.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 'image/png');
  }

  function toggleCover() {
    setShowCover(!showCover);
  }

  function openModal() {
    setShowModal(true);
  }
  function closeModal(){
    setShowModal(false);
  }
  const handleToggleMenu = () => {
    setIsOptMenuOpen(!isOptMenuOpen);
  };

  return (
    <>
    <div className={`cover ${showCover ? 'close' : 'open' }`} onClick={toggleCover}>
      <div className='down-up-arrows'>
        <h3>{showCover ? '↑' : '↓'}</h3>
        <h3>{showCover ? '↑' : '↓'}</h3>
        <h3>{showCover ? '↑' : '↓'}</h3>
      </div>
      <div className='cover-content'>
        <h1>Scribble Lounge</h1>
        <div className='cover-copy'>
          <h3>Welcome to Scribble Lounge! The place where you can make amazing collaborative drawings with friends!</h3>
          <h3>Connect with friends and make beautiful, unique drawings together. Simply send them a link to the site and you can start creating together in real-time.</h3>
          <h3>Download and save your drawings to the gallery, so you can revisit them at any time. Plus, you can undo your last mark, which won&apos;t register on your partner&apos;s canvas, giving you the freedom to experiment and create something truly original together. And if you&apos;re not happy with your drawing, no sweat! Simply clear the canvas and start fresh.</h3>
          <h3>Be sure to check out the gallery to see the amazing work of other artists. You&apos;ll be inspired by the creativity and imagination on display.</h3>
          <h3>So what are you waiting for? Grab a friend and start making some amazing collaborative drawings together in the Scribble!</h3>
        </div>
      </div>
    </div> 
  <div className="whiteboard-container" style={{ height: '100%', width: '100%' }}>
    <canvas className="whiteboard" id="my-canvas" ref={canvasRef} onClick={() => setShow(false)}></canvas>
    <div id='main-container'>
      <div id='menu-container-mobile'>     
        <button className={`menu-toggle ${show ? `menu_active` : null }`} onClick={() => setShow(!show)} onKeyDown={() => setShow(!show)} tabIndex={0}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </button>
      </div>
    </div>
    
    <div className={`nav-container-mobile ${show ? `menu_active` : null }`} >      
      <div className='colors'>
        {colorDivs}
      </div>
      <div id="line-width">
          <div className='line-inputs'>
            <input
              id='line-width-slider'
              type="range"
              min="3"
              max="100"
              value={lineWidth}
              onChange={(event) => setLineWidth(Number(event.target.value))}
              style={{ backgroundColor: color }}
            />
            <output>{lineWidth}</output>
          </div>
          <label>Brush Width</label>
        </div>
    </div>
    <div className='options-menu' onClick={handleToggleMenu}>Options
      <div className='dropdown-menu'>
        <button className='dropdown_item-1' id='undo-button' onClick={handleUndo}>Undo</button>
        <button className='dropdown_item-2' id="clear-canvas-button">Clear Canvas</button>
        <button className='dropdown_item-4' onClick={toPNG}>Download</button>
      </div>
    </div>
    <div className='save-to-gallery'>
      <button className='save-to-gallery-buttons' onClick={openModal}>Save</button>
      {showModal && (
        <div className='modal-overlay'>
          <div className={`modal ${showModal ? 'active' : ''}`}>
            <h1>Save to Gallery</h1>
            <p>Share your collab or individual piece!</p>
            <div className='nt-container'>
              <input className='form-field' type="text" name='name' id='name-input' placeholder='name' />
              <label htmlFor="name" className='form-label'>Name (optional)</label>
            </div>
            <div className='nt-container'>
              <input type="text" id="title-input" className='form-field' name='title' placeholder='title'/>
              <label htmlFor="title" className='form-label'>Title (optional)</label>
            </div>
            <button className='save-to-gallery-buttons' onClick={handleUpload}>Save to Gallery</button>
            <button className='modal-close' onClick={closeModal}>X</button>
          </div>
        </div>
      )}
    </div>
    <div className="gallery-link">
      <Link href="/gallery">Gallery Page →</Link>
    </div>
    {/* <Gallery /> */}
  </div>
  </>
  );
  }
  
  export default Whiteboard;