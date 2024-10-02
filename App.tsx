import * as React from 'react';
import { ActivityIndicator, Button, StatusBar, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { uploadFiles } from './utils/tus';

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
          Example: Upload Images or Documents
        </Text>

        {this._maybeRenderControls()}
        {this._maybeRenderUploadingIndicator()}

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
            <Button onPress={this._pickDoc} title="Pick a document" />
          </View>
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

    this._handleAssetsPicked(pickerResult);
  };

  _pickImage = async () => {
    await this._askPermission(
      'We need the camera-roll permission to read pictures from your phone...'
    );

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
    });

    this._handleAssetsPicked(pickerResult);
  };

  _pickDoc = async () => {
    let pickerResult = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
      multiple: true,
    });

    this._handleAssetsPicked(pickerResult);
  };

  _handleAssetsPicked = async (
    pickerResult:
      | ImagePicker.ImagePickerResult
      | DocumentPicker.DocumentPickerResult
  ) => {
    try {
      this.setState({ uploading: true });

      if (!pickerResult.canceled) {
        await uploadFiles('tus', pickerResult);
      }
    } catch (e) {
      console.log({ e });
      alert('Upload failed, sorry :(');
    } finally {
      this.setState({ uploading: false });
    }
  };
}
