import Link from "next/link"
import styles from "./Navbar.module.css"
import { useEffect } from "react"
import {RiArrowLeftRightLine} from "react-icons/ri"
import { useDexContext } from "../../utils/dexContext"
const Navbar = () => {

  // Importing the current Address from DexContext
  const {currentAddress, getProviderOrSigner} = useDexContext();
  useEffect(() => {
    window.ethereum.on("accountsChanged", () => {
      getProviderOrSigner();
    })
  }, [])
  

  return (
    <nav className={styles.navbar_container}>
    <div className={styles.navbar}>
    <Link href="/" className={styles.logo}><RiArrowLeftRightLine /> DeSwap</Link>
    
    <Link href="/"><h1 className={styles.title}>Welcome to DeSwap Exchange!</h1></Link>
    <Link href="/mintTokens">Get Crypto Dev Tokens</Link>
    </div>
    <p>{currentAddress.length > 0 ? `Connected to ${currentAddress.substring(0, 18)}.....${currentAddress.substring(27)}`: `Wallet Not Connected`}</p>
    </nav>
  )
}

export default Navbar;