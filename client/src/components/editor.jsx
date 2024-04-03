import React, { useDebugValue, useEffect, useState } from 'react'
import { Box } from "@mui/material"
import Quill from 'quill';
import "quill/dist/quill.snow.css"
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  ['link', 'image', 'video', 'formula'],

  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
  // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']                                         // remove formatting button
];

const Editor = () => {

  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const { id } = useParams();


  useEffect(() => {
    const options = {
      debug: 'info',
      modules: {
        toolbar: toolbarOptions,
      },
      placeholder: 'Begin with the new',
      theme: 'snow'
    };
    const quillserver = new Quill('#editor', options);
    quillserver.disable();
    quillserver.setText('loading the document...')
    setQuill(quillserver);
  }, []);


  //for connnection event

  useEffect(() => {
    const socketserver = io( import.meta.env.VITE_BACKEND ||  'http://localhost:8000')
    setSocket(socketserver);
    return () => {
      socketserver.disconnect();
    }
  }, []);



  //  for text change

  useEffect(() => {

    if (socket === null || quill === null) return;

    const handlechange = (delta, oldData, source) => {
      if (source !== 'user') return
      socket && socket.emit('send-changes', delta);
    }

    quill && quill.on('text-change', handlechange);

    return () => {
      quill && quill.off('text-change', handlechange``);
    }
  }, [quill, socket]);


  //  for recieve event

  useEffect(() => {

    if (socket === null || quill === null) return;

    const handlechange = (delta) => {
      quill.updateContents(delta);
    }

    socket && socket.on('receive-changes', handlechange);

    return () => {
      socket && socket.off('receive-changes', handlechange);
    }
  }, [quill, socket]);

  // loading document
  useEffect(() => {
    if (quill === null || socket === null) return;

    socket && socket.once('load-document', document => {
       quill.setContents(document);
       quill.enable();
    })

    socket && socket.emit('get-document', id);
  }, [quill, socket, id]);

  // data saving in interval

  useEffect(() => {
    if(socket === null || quill === null) return;

    const interval = setInterval(() => {
       socket && socket.emit('save-document', quill.getContents());
    }, 2000);

    return () =>{
      clearInterval(interval);
    }
  },[socket, quill]);

  return (

    <div className="bg-gray-100">
      <Box id="editor"></Box>
    </div>
  )
}

export default Editor