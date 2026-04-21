import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import StyleSheet from "../StyleSheet";

const CustomInput = ({
  style,
  label,
  placeholder,
  secureTextEntry,
  autoComplete,
  keyboardType,
  multiline,
  onChangeText,
  value,
  required = false,
  forceValidate = false,
  textContentType,
}) => {
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validate = () => {
    const errorMessage = validateInput(value);
    if (errorMessage) {
      setError(true);
      setErrorMsg(errorMessage);
    } else {
      setError(false);
      setErrorMsg("");
    }
  };

  useEffect(() => {
    if (forceValidate) validate();
  }, [forceValidate]);

  const handleBlurValidate = () => {
    const errorMessage = validateInput(value);
    if (errorMessage) {
      setError(true);
      setErrorMsg(errorMessage);
    } else {
      setError(false);
      setErrorMsg("");
    }
  };

  const emojiTimeoutRef = useRef(null);

  const removeEmojis = (text) => {
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{3030}\u{FE0F}\u{00A9}\u{00AE}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}\u{21A9}\u{21AA}\u{231A}-\u{231B}\u{2328}-\u{2329}\u{25AA}\u{25AB}\u{25FE}\u{2B06}\u{2194}\u{2195}\u{21A9}\u{21AA}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B06}\u{2934}\u{2935}\u{25AA}\u{25AB}]/gu;
    return text.replace(emojiRegex, "");
  };

  const handleChangeText = (text) => {
    const cleanedText = removeEmojis(text);

    if (cleanedText !== text) {
      setError(true);
      setErrorMsg("Emojis are not allowed");

      if (emojiTimeoutRef.current) {
        clearTimeout(emojiTimeoutRef.current);
      }

      emojiTimeoutRef.current = setTimeout(() => {
        const errorMessage = validateInput(cleanedText);
        if (errorMessage) {
          setError(true);
          setErrorMsg(errorMessage);
        } else {
          setError(false);
          setErrorMsg("");
        }
      }, 3000);

      onChangeText(cleanedText);
      return;
    }

    onChangeText(cleanedText);

    const errorMessage = validateInput(cleanedText);
    if (errorMessage) {
      setError(true);
      setErrorMsg(errorMessage);
    } else {
      setError(false);
      setErrorMsg("");
    }
  };

  const validateInput = (text) => {
    if (required && !text) {
      switch (label) {
        case "desc_service_perf":
          return "Description of service performed is required";
        case "desc_material_inst":
          return "Description of materials installed is required";
        case "walkthrough":
          return "Final Walkthrough is required.";
        case "desc_return_needed":
          return "Reason for return needed is required";
        case "manager_name":
          return "The on-site manager's name is required";
        default:
          return `${label} is required`;
      }
    }

    switch (label) {
      case "username":
        if (!text) return "Please enter your username";
        break;
      case "password":
        if (!text) return "Please enter your password";
        break;
      case "email":
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(text)) return "Please enter a valid email address";
        break;
      case "phone_nbr":
        const phoneRegex =
          /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,5}$/im;
        if (!phoneRegex.test(text)) return "Please enter a valid phone number";
        break;
      case "first_name":
      case "last_name":
        const nameRegex = /^[a-zA-ZÀ-ÿ-']+( [a-zA-ZÀ-ÿ-']+)*$/;
        if (!nameRegex.test(text)) return `Please enter a valid ${label}`;
        break;
    }

    return "";
  };

  return (
    <View>
      {error && <Text style={StyleSheet.valMessageText}>{errorMsg}</Text>}
      <TextInput
        label={label}
        style={style}
        placeholder={placeholder}
        placeholderTextColor={"black"}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        multiline={multiline}
        value={value}
        onChangeText={handleChangeText}
        onBlur={handleBlurValidate}
        accessibilityLabel={label}
        textContentType={textContentType}
      />
    </View>
  );
};

export default CustomInput;
