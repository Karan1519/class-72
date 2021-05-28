import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet,Image, Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { TextInput } from 'react-native-gesture-handler';
import * as firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedData: '',
        buttonState: 'normal',
        scannedBookId:'',
        scannedStudentId:'',
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      this.setState({
        scanned: true,
        scannedData: data,
        buttonState: 'normal'
      });
    }

    handleTransaction =async()=>{
      var TransactionMassage
        db.collection("Books").doc(this.state.scannedBookId).get()
        .then((doc)=>{
         // console.log(doc.data())
         var book = doc.data()
         if(book.bookAvailability){
           this.initiateBookIssue();
           TransactionMassage = "Book Issued"
         }
         else{
          this.initiateBookReturn();
          TransactionMassage = "Book Returned"
         }
        })
        this.setState({
          TransactionMassage:TransactionMassage
        })
    }
    initiateBookIssue = async ()=>{
      //this is to add transaction
      db.collection("Transaction").add({
        'studentId':this.state.scannedStudentId,
        'bookId':this.state.scannedBookId,
        'DOT':firebase.firestore.Timestamp.now().toDate(),
        'TOT':"Return"
      })

      //Change book status.
      db.collection("Books").doc(this.state.scannedBookId).update({
        'bookAvailability':false
      })

        //Change number of issued books for students.
        db.collection("Students").doc(this.state.scannedStudentId).update({
          'numberOfBooksIssued':firebase.firestore.FieldValue.increment(+1)
        })
        Alert.Alert("BookIssued")
        this.setState({
          scannedBookId:'',
          scannedStudentId:''
        })
    }

    initiateBookReturn = async ()=>{
      //this is to add transaction
      db.collection("Transaction").add({
        'studentId':this.state.scannedStudentId,
        'bookId':this.state.scannedBookId,
        'DOT':firebase.firestore.Timestamp.now().toDate(),
        'TOT':"Return"
      })

      //Change book status.
      db.collection("Books").doc(this.state.scannedBookId).update({
        'bookAvailability':true
      })

        //Change number of issued books for students.
        db.collection("Students").doc(this.state.scannedStudentId).update({
          'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
        })
        Alert.Alert("BookReturned")
        this.setState({
          scannedBookId:'',
          scannedStudentId:''
        })
    }


    

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <View style={styles.container}>
          <View>
          <Image
          source = {require('../assets/booklogo.jpg')}
          style = {{width:200,height:200}}/>
          <Text style = {{textAlign:'center',fontSize:30}}>Wily</Text>
          </View>

          <View style ={styles.inputView}>
            <TextInput
              style = {styles.inputBox}
              placeholder = "Book Id"/>
            <TouchableOpacity style = {styles.scanButton}
              onPress = {()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style = {styles.buttonText}>Scan</Text>
              </TouchableOpacity>  
          </View>

          <View style ={styles.inputView}>
            <TextInput
              style = {styles.inputBox}
              placeholder = "Student Id"/>
            <TouchableOpacity style = {styles.scanButton}
            onPress = {()=>{
              this.getCameraPermissions("StudentId")
            }}>
              <Text style = {styles.buttonText}>Scan</Text>
              </TouchableOpacity>  
          </View>

            <TouchableOpacity style = {styles.submitButton}
            onPress = {async()=>{this.handleTransaction()}}>
            <Text style = {styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

          </View>


        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign:'center',
      marginTop:10,
    },
    inputView:{
      flexDirection:'row',
      margin:20,
    },
    inputBox:{
      width:200,
      height:40,
      borderWidth:1.5,
      borderRightWidth:0,
      fontSize:20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width:50,
      borderWidth:1.5,
      borderLeftWidth:0
    },
    submitButton:{
      backgroundColor: '#FBC02D',
      width:100,
      height:60,
    },
    submitButtonText:{
      padding:10,
      textAlign:'center',
      fontSize:20,
      fontWeight:"bold",
      color:'white'
    }

  });
