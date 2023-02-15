import Head from "next/head";

import '../styles/globals.css'

import Navbar from "../Component/Navbar/Navbar"
import Footer from "../Component/Footer/Footer"
import DexProvider from "../utils/dexContext";


function MyApp({ Component, pageProps }) {
  return (
    <div>
      <DexProvider>
      <Navbar />
  <Component {...pageProps} />
  <Footer />
      </DexProvider>
    </div>
  )
}

export default MyApp
