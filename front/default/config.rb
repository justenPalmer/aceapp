# Require any additional compass plugins here.
require "compass-growl"
require "animation"

# Get the directory that this configuration file exists in
dir = File.dirname(__FILE__)

# Set this to the root of your project when deployed:
http_path = "/"
sass_path = File.join(dir, "sass")
css_path = File.join(dir)
images_dir = "dashboard/img"

#Denotes how the CSS files are compiled by Compass
output_style = :expanded
environment = :production

# You can select your preferred output style here (can be overridden via the command line):
# output_style = :expanded or :nested or :compact or :compressed

# To enable relative paths to assets via compass helper functions. Uncomment:
relative_assets = true

# To disable debugging comments that display the original location of your selectors. Uncomment:
# line_comments = false


# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass
