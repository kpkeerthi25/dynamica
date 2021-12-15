import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import { nftaddress, nftmarketaddress } from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState([])
  console.log(fileUrl)
  const [formInput, updateFormInput] = useState({
    price: '',
    collectionName: '',
    description: '',
  })
  const [apiForm, updateApiForm] = useState({
    uri: '',
    param: '',
    path: '',
    outcomes: 0,
  })
  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0]
    const name = e.target.name
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      })
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl([...fileUrl,{name,url}])
      console.log(fileUrl)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }
  async function createMarket() {
    // const { name, description, price } = formInput
    // if (!name || !description || !price || !fileUrl) return
    // /* first, upload to IPFS */
    // const data = JSON.stringify({
    //   name,
    //   description,
    //   image: fileUrl,
    // })
    // try {
    //   const added = await client.add(data)
    //   const url = `https://ipfs.infura.io/ipfs/${added.path}`
    //   /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
    //   createSale(url)
    // } catch (error) {
    //   console.log('Error uploading file: ', error)
    // }
    const { collectionName, description, price } = formInput
    if (!collectionName || !description || !price || !fileUrl) return
    /* first, upload to IPFS */
    for(let i=0;i<fileUrl.length;i++) {
      const data = JSON.stringify({
        collectionName,
        description,
        image: fileUrl[i].url,
        name: fileUrl[i].name

      })
      try {
        const added = await client.add(data)
        const url = `https://ipfs.infura.io/ipfs/${added.path}`
        /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
        createSale(url)
        
      } catch (error) {
        console.log('Error uploading file: ', error)
      }
    }
    router.push('/')
    
  }

  async function createSale(url) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()

    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, {
      value: listingPrice,
    })
    await transaction.wait()
    
  }

  return (
    <div className="flex-row ">
      <div className="flex flex-col  ">
        <div
          className=" flex flex-col pb-12 w-3/4"
          style={{ margin: '0 auto' }}
        >
          <input
            placeholder="Asset Collection Name"
            className="mt-8 border border-black rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, collectionName: e.target.value })
            }
          />
          <textarea
            placeholder="Asset Description"
            className="mt-2 border border-black rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, description: e.target.value })
            }
          />
          <input
            placeholder="Asset Price in Eth"
            className="mt-2 border border-black  rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, price: e.target.value })
            }
          />
        
          {/* <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <img className="rounded mt-4" width="350" src={fileUrl} />
          )
        } */}
          {/* <button onClick={createMarket} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"> */}
        </div>
      </div>

      <div className="flex flex-row justify-content-around ml-12  mr-12 ">
        <input
          placeholder="Request API"
          className="mt-2 border border-black rounded p-4 w-3/4"
          onChange={(e) => updateApiForm({ ...apiForm, uri: e.target.value })}
        />
        <input
          placeholder="query params"
          className="mt-2 border border-black rounded p-4 ml-10"
          onChange={(e) =>
            updateApiForm({ ...apiForm, params: e.target.value })
          }
        />
        <input
          placeholder="output path"
          className="mt-2 border border-black rounded p-4 ml-10"
          onChange={(e) => updateApiForm({ ...apiForm, path: e.target.value })}
        />
        <input
          placeholder="outcomes"
          className="mt-2 border border-black rounded p-4 ml-10"
          type="number"
            min="0"
            max="5"
            step="1"
          onChange={(e) =>
            updateApiForm({ ...apiForm, outcomes: e.target.value })
          }
        />
      </div>
  
      <div>
      { apiForm.outcomes && Array.apply(null, { length: apiForm.outcomes }).map((img,i)=>(
  <div flex flex-col justify-content-around>
        <input
          placeholder="Asset  Name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, collectionName: e.target.value })
          }
        />
        <input
          placeholder="Asset Description"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, collectionName: e.target.value })
          }
        />
         <input
          type="file"
          name={"Asset" + i}  
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl[i] && (
            <img className="rounded mt-4" width="350" src={fileUrl[i].url} />
          )
        }
      </div>
))
  
}
      </div>
      <div className='flex justify-center '>
        <button className="font-bold mt-4 bg-pink-500 text-white rounded p-4 pl-6 pr-6 shadow-lg " onClick={createMarket}>
          Create Dynamica Assets
        </button>
      </div>

      
    </div>
  )
}
