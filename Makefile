
static_dir = static
build_dir = build

client_files = jquery.js sockjs.min.js prod.js mixpanel.js util.js chat.js ui.js driver.js
client_paths = $(foreach file, $(client_files), client/$(file))

rebuild:
	$(MAKE) clean
	$(MAKE) build

build: $(build_dir)/rabblr.js $(build_dir)/rabblr.css $(build_dir)/rabblr.conf
	mkdir $(static_dir)
	mkdir $(build_dir)
	cp $(build_dir)/rabblr.js $(static_dir)/rabblr.js
	cp $(build_dir)/rabblr.css $(static_dir)/rabblr.css
	cp client/index.html $(static_dir)/
	cp -R client/bootstrap $(static_dir)/

clean:
	rm -rf $(build_dir)/*
	rm -rf $(static_dir)/*

$(build_dir)/rabblr.conf: server/nginx/rabblr.conf
	cp server/nginx/rabblr.conf $(build_dir)/rabblr.conf

$(build_dir)/rabblr.js: $(client_paths) client/rabblr.css
	cat $(client_paths) > $(build_dir)/rabblr.uncompressed.js
	java -jar yuicompressor-2.4.7.jar $(build_dir)/rabblr.uncompressed.js > $(build_dir)/rabblr.js
	java -jar yuicompressor-2.4.7.jar client/rabblr.css > $(build_dir)/rabblr.css
