public class Encryption {

    static int rot = 10;

    public String rotRev(String msg) {
        String s = rotate(reverse(msg));
        return s;
    }

    public String unrotRev(String msg) {
        String s = unrotate(reverse(msg));
        return s;
    }

    public String reverse(String msg) {
        StringBuilder tmp = new StringBuilder();
        tmp.append(msg);
        tmp.reverse();
        return tmp.toString();
    }

    public String rotate(String msg) {
        String s = "";
        for (int i = 0; i < msg.length(); i++){
            int enc = (msg.charAt(i) + rot) % 128;
            char c = (char) enc;
            s = s + c;
        }
        return s;
    }

    public String unrotate(String msg) {
        String s = "";
        for (int i = 0; i < msg.length(); i++){
            int enc = (msg.charAt(i) - rot);
            if (enc < 0) enc += 128;
            char c = (char) (enc % 128);
            s = s + c;
        }
        return s;
    }
}