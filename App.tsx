import * as React from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  StatusBar,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from './utils/tus';

export default class App extends React.Component {
  state = {
    image: null,
    uploading: false,
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text
          style={{
            fontSize: 20,
            marginBottom: 20,
            textAlign: 'center',
            marginHorizontal: 15,
          }}
        >
          Example: Upload ImagePicker result
        </Text>

        {this._maybeRenderControls()}
        {this._maybeRenderUploadingIndicator()}
        {this._maybeRenderImage()}

        <StatusBar barStyle="default" />
      </View>
    );
  }

  _maybeRenderUploadingIndicator = () => {
    if (this.state.uploading) {
      return <ActivityIndicator animating size="large" color="#0000ee" />;
    }
  };

  _maybeRenderControls = () => {
    if (!this.state.uploading) {
      return (
        <View>
          <View style={{ marginVertical: 8 }}>
            <Button
              onPress={this._pickImage}
              title="Pick an image from camera roll"
            />
          </View>
          <View style={{ marginVertical: 8 }}>
            <Button onPress={this._takePhoto} title="Take a photo" />
          </View>
        </View>
      );
    }
  };

  _maybeRenderImage = () => {
    if (this.state.image) {
      return (
        <View
          style={{
            marginTop: 30,
            width: 250,
            borderRadius: 3,
            elevation: 2,
            shadowColor: 'rgba(0,0,0,1)',
            shadowOpacity: 0.2,
            shadowOffset: { width: 4, height: 4 },
            shadowRadius: 5,
          }}
        >
          <View
            style={{
              borderTopRightRadius: 3,
              borderTopLeftRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: this.state.image }}
              style={{ width: 250, height: 250 }}
            />
          </View>

          <Image
            style={{ paddingVertical: 10, paddingHorizontal: 10 }}
            source={{ uri: this.state.image }}
          />
        </View>
      );
    }
  };

  _askPermission = async (failureMessage) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status === 'denied') {
      alert(failureMessage);
    }
  };
  _askCameraPermission = async (failureMessage) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'denied') {
      alert(failureMessage);
    }
  };

  _takePhoto = async () => {
    await this._askCameraPermission(
      'We need the camera permission to take a picture...'
    );
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    await this._askPermission(
      'We need the camera-roll permission to read pictures from your phone...'
    );

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    this._handleImagePicked(pickerResult);
  };

  _handleImagePicked = async (pickerResult: ImagePicker.ImagePickerResult) => {
    console.log(JSON.stringify(pickerResult, null, 2));
    let uploadResponse, uploadResult;

    try {
      this.setState({ uploading: true });

      if (!pickerResult.canceled) {
        await uploadFile('tus', pickerResult);
        this.setState({ image: pickerResult.assets[0].uri });
      }
    } catch (e) {
      console.log({ uploadResponse });
      console.log({ uploadResult });
      console.log({ e });
      alert('Upload failed, sorry :(');
    } finally {
      this.setState({ uploading: false });
    }
  };
}
