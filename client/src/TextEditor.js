import { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
  ]

export default function TextEditor() {
    const [socket, setsocket] = useState()
    const [quill, setQuill] = useState()
    const { id: documentId } = useParams()

    useEffect(() => {
        const s = io("http://localhost:3001")
        setsocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    useEffect(() => {
        if(quill == null || socket == null) return
        const handler = delta => {
            quill.updateContents(delta)
        }
        socket.on('recieve-changes', handler)
        return () => {
            socket.off('recieve-changes', handler)
        }
    }, [socket, quill])

    useEffect(() => {
        if(socket == null || quill == null) return

        socket.once('load-document', document => {
            quill.setContents(document)
            quill.enable()
        })

        socket.emit('get-document', documentId)

    }, [socket, quill, documentId])

    useEffect(() => {
        if(socket == null || quill == null) return

        const interval = setInterval(() => {
            socket.emit('save-document', quill.getContents())
        }, 2000)

        return() => {
            clearInterval(interval)
        }
    }, [socket, quill])

    useEffect(() => {
        if(quill == null || socket == null) return
        const handler = (delta, oldDelta, source) => {
            if(source !== 'user') return
            socket.emit("send-changes", delta)
        }
        quill.on('text-change', handler)
        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])

    const wrapperRef = useCallback((wrapper) => {
        if(wrapper == null) return;
        wrapper.innerHtml = '';
        const editor = document.createElement('div');
        wrapper.append(editor);
        const q = new Quill(editor, {theme: "snow", modules: {toolbar : TOOLBAR_OPTIONS},})

        q.disable()
        q.setText('Wait....')
        setQuill(q)
    }, []);
    return (
        <div className="container" ref={wrapperRef}></div>
    )
}
