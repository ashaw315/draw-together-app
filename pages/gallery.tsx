import Head from 'next/head'
// import Image from 'next/image'
import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import { useEffect, useState } from 'react'
import Gallery from '@/components/allimages'
import Link from 'next/link'

function GalleryPage () {

    return (
        <div>
            This is the gallery page
            <Gallery />
        </div>
    )
}

export default GalleryPage;