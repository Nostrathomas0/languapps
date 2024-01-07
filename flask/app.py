from flask import Flask, render_template, request
import boto3
import random

app = Flask(__name__)
# Set up an s3 client
s3 = boto3.client('s3')

# Route for servinc the client
@app.route('/')
def home():
     # Download the index.html file from S3
    s3.download_file('anglais.plus', 'index.html', '/tmp/index.html')
     # Render the index.html file
    with open('/tmp/index.html', 'r') as f:
        content = f.read()
    return content 

@app.route('/generate-sentence', methods=['POST'])
def generate_sentence():
    sentence = run_python_script()
    return render_template('index.html', sentence=sentence)

def run_python_script():
    # Your Python script here
    # coding utf-8
    import random

    templates = [
        "{thorn} {garden} {yard} {Iverb}s {Prep} the {garden} {yard}.",
        "{pro} {Verb2} {Tverb} {thorn} {neigh}",
        "You {Verb2} {Tverb} {horse} {Prep} {barrow} {adjective} {noun}.",
        "I am {cairne}.",
        "{pro} {Tverb}s {preposition} the {adjective} {noun} {disc} {pros} {rose} {woods} {horse}.",
        "{det} {arch} {Iverb} {rose} {thorn} {yard}"
    ]

    # Define a list of noun phrases that includes pronouns and noun phrases with articles
    #noun_phrases = pronouns + [f"{article} {noun}" for article in articles for noun in nouns]

    pro = [ "I" , "You" , "We" , "They" ]
    pros = [ "it", "she", "we", "you", "they", "he", "zi" ]
    arch = [ "One", "that", "this", "these" , "Other", "here", "their", "what" ]
    det = [ "All", "Many", "Some","Few" ,"Big" ,"Long" ,"Wide" ,"Thick" ,"Heavy" ,"Small" ,"Short" ,"Narrow" ,"Thin" ]
    neigh = [" woman" , "man" , "child" , "woods" , "wife" , "husband" , "mother" , "tablet" , "father" , "animal" , "fish" , "bird" , "dog" , "louse" , "snake" , "worm" , "tree" , "forest" , "stick" , "fruit" , "seed" , "leaf" , "root" , "bark" , "flower" , "grass" , "rope" , "skin" , "meat" , "blood" , "bone" , "fat" , "egg" , "horn" , "tail" , "feather" , "hair" , "head" , "ear" , "eye" , "nose" , "mouth" , "tooth" , "tongue" , "fingernail" , "foot" , "leg" , "knee" , "hand" , "wing" , "belly" , "guts" , "neck" , "back" , "breast" , "heart" , "liver" ]
    Iverb = [ "sleep" , "stay" , "laugh" , "exist" , "spit" , "breathe" , "stay" , "dig " ]
    Verb2 = [ "want", "like", "begin", "stop", "manage" ]
    Tverb = [ "to drink" , "to eat" , "to bite" , "to suck" , "to vomit" , "to blow"  , "to see" , "to hear" , "to know" , "to think" , "to smell" , "to live" , "to die" , "to kill" , "to fight" , "to hunt" , "to hit" , "to cut" , "to split" , "to stab" , "to scratch" , "to swim" , "to fly" , "to walk" , "to come " , "to lie" , "to sit" , "to stand" , "to turn" , "to fall" , "to give" , "to hold" , "to squeeze" , "to rub" , "to wash" , "to wipe" , "to pull" , "to push" , "to throw" , "to tie" , "to sew" , "to count" , "to say" , "to sing" , "to play" , "to float" , "to flow" , "to freeze" , "to swell" ]
    Prep = [ "near" , "far" , "right" , "left" , "at" , "in" , "on" , "at" , "around" , "about" , "with" , "under" , "of" ,  "for" ]
    disc = [ "and" , "or" ]
    barrow = [ "your" , "its" , "their" ]
    cairne = [ "fine" , "full" , "great" , "grumpy" , "famished" , "straight" , "drunk" ]
    yard = [ " sun" , "moon" , "star" , "name" , "water" , "rain" , "river" , "lake" , "sea" , "salt" , "stone" , "sand" , "dust" , "earth" , "cloud" , "fog" , "sky" , "wind" , "snow" , "ice" , "smoke" , "fire" , "ash" , "to burn" , "road" , "mountain" , "red" , "green" , "yellow" , "white" , "black" , "night" , "day" , "year" , "arm" , "garden" ]
    garden = [ "cold" , "full" , "new" , "old" , "good" , "bad" , "rotten" , "dirty" , "straight" , "round" , "sharp" , "dull" , "smooth" , "wet" , "dry" , "correct" , "new" ]
    rose = [  "in" , "with" , "and" , "from" ]
    thorn = [ "the" , "this" , "our" , "her" , "his" , "my" , "if" , "because" , "there" ]
    woods = [ "them" , "you" , "me" , "us" , "him" , "her" , "zim", "it" ] 
    horse = [ "here" , "there" , "slowly" , "intentionelly" , "unintentionelly" , "fast" , "neat"]

    # Choose a random template
    template = random.choice(templates)    


    # Replace slots in template with random words from lists
    sentence = template.format(
        pro=random.choice(pro),
        pros=random.choice(pros),
        arch=random.choice(arch),
        det=random.choice(det),
        neigh=random.choice(neigh),
        Iverb=random.choice(Iverb),
        Verb2=random.choice(Verb2),
        Tverb=random.choice(Tverb),
        Prep=random.choice(Prep),
        disc=random.choice(disc),
        barrow=random.choice(barrow),
        cairne=random.choice(cairne),
        yard=random.choice(yard),
        garden=random.choice(garden),
        rose=random.choice(rose),
        thorn=random.choice(thorn),
        woods=random.choice(woods),
        horse=random.choice(horse)
    )

    print(sentence)

