import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom"
import axios from "axios"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination'
import {w3cwebsocket as W3CWebSocket } from 'websocket';
import styles from "./style.module.css"
const columns=[
    {id:"symbol",minWidth:100},
    {id:"description",minWidth:100},
    {id:"asset",minWidth:100},
    {id:"mark_price",minWidth:100},
]

function TableComponent(props){
    const [initial,setInitialResponse]=useState(null)
    const [markPrice,setMarkPrice]=useState(null)
    let initialObject={};
    let apiCall;
   
    // arrow function to set the initial response from the api call
    const row = (data)=>{
        const array = [];
        const object={}
        data.forEach(row=>{
            const symbol=row.symbol;
            const description=row.description;
            const asset=row.underlying_asset.symbol
            object[symbol]="initial Value"
            array.push({symbol,description,asset})
        })
        initialObject={...object}
        return array;
    }

    // closure function that helps in reducing setState method call
    // with help of scoping
    function clojure(fn,length){
        let count=0;
        let globalScope=[];
        console.log(length)
        return function innerFn(...args){
            if(count===length){
                let object={};
                globalScope.forEach((obj)=>{
                    object={...object,...obj}
                })
                fn({...object})
                globalScope=[]
                count=0;
            }else{
                count+=1
                globalScope.push(...args)


            }
        }
    }

    // initial api call to populate symbol, description , underlying_asset
    useEffect(()=>{
       
        axios.get('https://api.delta.exchange/v2/products').then((res)=>{
            const data = row(res.data.result)
            setMarkPrice({...initialObject})
            setInitialResponse(data);
        })
        
    },[])

    //websocket connection to subscribe to channel v2/ticker
    // and listen for messages from server
    useEffect(()=>{
        const channels=initial && [...initial.map(symbol=>symbol.symbol)]
        apiCall={
            "type":"subscribe",
            "payload":{
                "channels":[
                    {
                        "name":"v2/ticker",
                        "symbols":channels && [...channels]
                    }
                ]
            }
        }
        const client = new W3CWebSocket("wss://production-esocket.delta.exchange")
        client.onopen=(event)=>{
            client.send(JSON.stringify(apiCall))
        }
        const func=clojure(setMarkPrice,channels?.length)
        client.onmessage = (event)=>{
            const json = JSON.parse(event.data);
            const object={[json.symbol]:json.mark_price}
            func(object)
        }
        return ()=> {client.close()}
    },[initial])

    return(
        initial&&<Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 800 }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                    <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell >Description</TableCell>
                        <TableCell >Underlying Asset</TableCell>
                        <TableCell >Mark Price</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                        {initial
                            .map((row,index)=>{
                                return(
                                    <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                                        {columns.map((column,index)=>{
                                            const value = row[column.id];
                                            return(
                                                <TableCell  
                                                key={column.id}
                                                className={column.id==='mark_price' && 
                                                markPrice[row.symbol]==="initial Value"||
                                                isNaN(Number(parseFloat(markPrice[row.symbol])))? 
                                                "white":"green"}>
                                                    {
                                                    column.id==='mark_price'?markPrice[row.symbol]:row[column.id]
                                                    }
                                                </TableCell>
                                            )
                                        })

                                        }
                                    </TableRow>
                                )
                            })

                        }
                    </TableBody>
                </Table>
            </TableContainer>
            <div className="time"></div>
    </Paper>
    )
}
ReactDOM.render(<TableComponent/>, document.getElementById("root"))