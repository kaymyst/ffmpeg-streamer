# ffmpeg-streamer

**ffmpeg-streamer** is a packaged nodejs [express](https://github.com/expressjs/express) server that wraps `ffmpeg` to allow easy streaming of video feeds directly to ***modern*** browsers for testing purposes.
It currently outputs only 1 stream which is *mjpeg*,
Video input types is the screen capture and the third argument can be set for selecting the screen ID
run ffmpeg -f avfoundation -list_devices true -i ""
to find out the list of devices

### Installation
**ffmpeg-streamer** has been packaged into an executable using [pkg](https://github.com/zeit/pkg).
The current binaries can be found on the [releases](https://github.com/kevinGodell/ffmpeg-streamer/releases/tag/v0.0.12) page.
* For desktop installation, simply download and extract.
* For command line installation, see the following steps.

###### Downloading zipped archive
*linux*
```console
wget https://github.com/kevinGodell/ffmpeg-streamer/releases/download/v0.0.12/ffmpeg-streamer-linux-x64.tar.gz
```
*mac*
```console
curl -L -O https://github.com/kevinGodell/ffmpeg-streamer/releases/download/v0.0.12/ffmpeg-streamer-macos-x64.zip
```

###### Extracting zipped archive
*linux*
```console
tar -xvf ffmpeg-streamer-linux-x64.tar.gz
```
*mac*
```console
unzip ffmpeg-streamer-macos-x64.zip
```

### Usage
* For desktop usage, double click the executable to run it.
* For command line usage, the following shows 2 options.

###### Start the app from the command line
*linux*
```console
./ffmpeg-streamer-linux-x64
```
*mac*
```console
./ffmpeg-streamer-macos-x64
```

###### Or start the app from the command line via [pm2](https://github.com/Unitech/pm2)
*linux*
```console
pm2 start ffmpeg-streamer-linux-x64
```
*mac*
```console
pm2 start ffmpeg-streamer-macos-x64
```
After launching, you can use it via the web interface on port 8181.
For example, if your are running it on your current machine, visit it in a ***modern*** browser via [http://localhost:8181](http://localhost:8181).
If port 8181 was already in use, it will keep incrementing the port number by 1 until it finds one available.
You can launch multiple copies of the app up to a total of 10, each listening on its own port.
If you would like to store your last used settings, go to [http://localhost:8181/activity](http://localhost:8181/activity) and click the "create" button to use the activity log.

#### Dependencies
**Ffmpeg** is the only external software required to run the app.
Nodejs is packaged inside the binary and is not needed to be installed separately on your system.
When launching the app, it tries to find ffmpeg on your system using [ffbinaries](https://github.com/vot/ffbinaries-node).
If it cannot find ffmpeg, you will be prompted to install it to the current running directory via the web interface on port 8181.
If it does find ffmpeg, but you would like to install a newer version, you can visit [http://localhost:8181/install](http://localhost:8181/install) and force the installation.

#### Development

###### Clone the repo and move into the newly created directory
```console
git clone https://github.com/kevinGodell/ffmpeg-streamer.git && cd ffmpeg-streamer
```

###### Install the module dependencies
```console
npm install
```

###### Start the app in development mode
```console
npm run dev
```

###### Build the binaries
```console
npm run dist:pkg
```

#### Feature requests and problems
If you have an idea for a new feature or have a problem, please do not hesitate to open an [issue](https://github.com/kevinGodell/ffmpeg-streamer/issues).
For problems, please include information about what operating system the app is running on and which operating system and browser you are using to view it.
Any additional details would be helpful.

#### Screenshots
![screenshot1](https://github.com/kevinGodell/ffmpeg-streamer/blob/master/screenshots/screenshot1_0.0.8.png?raw=true "Main Screen")
![screenshot2](https://github.com/kevinGodell/ffmpeg-streamer/blob/master/screenshots/screenshot2_0.0.8.png?raw=true "Video Player")

#### TODO
* [ ] Add support for more input types such as local video hardware and artificially generated input
* [ ] Add more ffmpeg settings to further customize the generated video for streaming
* [ ] Improve playback of *hls.js*
* [ ] Improve playback of *mse via socket.io*

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
